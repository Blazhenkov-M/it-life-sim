import json
import random
from pathlib import Path
from urllib.parse import quote

from fastapi import FastAPI, Form, Request
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

BASE_DIR = Path(__file__).parent

app = FastAPI()
templates = Jinja2Templates(directory=BASE_DIR / "templates")
app.mount("/audio", StaticFiles(directory=BASE_DIR / "audio"), name="audio")


def music_tracks() -> list[str]:
    music_dir = BASE_DIR / "audio" / "music"
    if not music_dir.is_dir():
        return []
    files = sorted(
        (p for p in music_dir.iterdir() if p.is_file() and p.suffix.lower() == ".mp3"),
        key=lambda p: p.name.lower(),
    )
    return [f"/audio/music/{quote(p.name)}" for p in files]

jobs = [
    {"name": "офисный шнырь", "min_level": 1, "laptop": None, "income": (20, 40)},
    {"name": "стажер dev", "min_level": 2, "laptop": None, "income": (40, 80)},
    {"name": "junior dev", "min_level": 3, "laptop": "Старый ноут", "income": (80, 120)},
    {"name": "middle dev", "min_level": 5, "laptop": "MacBook Air", "income": (120, 200)},
    {"name": "senior dev", "min_level": 8, "laptop": "MacBook Pro", "income": (200, 350)},
    {"name": "архитектор", "min_level": 12, "laptop": "Workstation", "income": (400, 600)},
]

laptops = [
    {"name": "Старый ноут", "price": 200},
    {"name": "MacBook Air", "price": 500},
    {"name": "MacBook Pro", "price": 1000},
    {"name": "Workstation", "price": 2000},
]

homes = [
    {"name": "Общага", "price": 0, "rest_bonus": 0},
    {"name": "Съёмная хата", "price": 300, "rest_bonus": 5},
    {"name": "Своя квартира", "price": 1000, "rest_bonus": 10},
]

transport = [
    {"name": "Пешком", "price": 0, "work_bonus": 0},
    {"name": "Самокат", "price": 200, "work_bonus": 10},
    {"name": "Электросамокат", "price": 800, "work_bonus": 25},
    {"name": "Жига", "price": 1500, "work_bonus": 40},
]

player = {
    "energy": 100,
    "mood": 100,
    "money": 100,
    "xp": 0,
    "level": 1,
    "job": "офисный шнырь",
    "laptop": None,
    "home": "Общага",
    "transport": "Пешком",
}

log: list[str] = []


def get_current_job() -> dict:
    return next(j for j in jobs if j["name"] == player["job"])


def get_home_rest_bonus() -> int:
    h = next((x for x in homes if x["name"] == player["home"]), None)
    return int(h["rest_bonus"]) if h else 0


def get_transport_work_bonus_pct() -> int:
    t = next((x for x in transport if x["name"] == player["transport"]), None)
    return int(t["work_bonus"]) if t else 0


def clamp(value: int, lo: int = 0, hi: int = 100) -> int:
    return max(lo, min(hi, value))


def add_log(msg: str) -> None:
    log.append(msg)
    if len(log) > 5:
        log.pop(0)


def check_level_up() -> None:
    while player["xp"] >= player["level"] * 100:
        player["xp"] -= player["level"] * 100
        player["level"] += 1
        player["energy"] = 100
        add_log(f"🎉 Level up! Теперь ты уровень {player['level']}!")


@app.post("/work")
def work():
    if player["energy"] < 15:
        add_log("❌ Не хватает энергии для работы!")
        return RedirectResponse("/?tab=work&worktab=freelance", status_code=303)

    job = get_current_job()
    base = random.randint(*job["income"])
    bonus_pct = get_transport_work_bonus_pct()
    earned = int(base * (1 + bonus_pct / 100))
    player["energy"] = clamp(player["energy"] - 15)
    player["mood"] = clamp(player["mood"] - 5)
    player["money"] += earned
    player["xp"] += 10
    if bonus_pct:
        add_log(
            f"💻 Поработал ({player['job']}). Заработал {earned}₽ "
            f"(+{bonus_pct}% от транспорта), получил 10 XP."
        )
    else:
        add_log(f"💻 Поработал ({player['job']}). Заработал {earned}₽, получил 10 XP.")
    check_level_up()
    return RedirectResponse("/?tab=work&worktab=freelance", status_code=303)


@app.post("/rest")
def rest():
    rest_bonus = get_home_rest_bonus()
    player["energy"] = clamp(player["energy"] + 25 + rest_bonus)
    player["mood"] = clamp(player["mood"] + 10)
    add_log(f"😴 Отдохнул. Энергия +{25 + rest_bonus}, настроение +10.")
    return RedirectResponse("/?tab=work&worktab=freelance", status_code=303)


@app.post("/fun")
def fun():
    if player["money"] < 20:
        add_log("❌ Не хватает денег на развлечения!")
        return RedirectResponse("/?tab=fun", status_code=303)

    player["mood"] = clamp(player["mood"] + 20)
    player["money"] -= 20
    add_log("🎮 Развлёкся! Настроение +20, деньги -20.")
    return RedirectResponse("/?tab=fun", status_code=303)


@app.post("/buy_laptop")
def buy_laptop(name: str = Form()):
    laptop = next((l for l in laptops if l["name"] == name), None)
    if not laptop:
        add_log("❌ Такого ноутбука не существует!")
        return RedirectResponse("/?tab=shop&store=pms", status_code=303)
    if player["money"] < laptop["price"]:
        add_log(f"❌ Недостаточно денег на {name}! Нужно {laptop['price']}₽.")
        return RedirectResponse("/?tab=shop&store=pms", status_code=303)
    player["money"] -= laptop["price"]
    player["laptop"] = name
    add_log(f"💻 Купил {name} за {laptop['price']}₽!")
    return RedirectResponse("/?tab=shop&store=pms", status_code=303)


@app.post("/apply_job")
def apply_job(name: str = Form()):
    job = next((j for j in jobs if j["name"] == name), None)
    if not job:
        add_log("❌ Такой работы не существует!")
        return RedirectResponse("/?tab=work&worktab=career", status_code=303)
    if player["level"] < job["min_level"]:
        add_log(f"❌ Недостаточно уровня для «{name}»! Нужен {job['min_level']}.")
        return RedirectResponse("/?tab=work&worktab=career", status_code=303)
    if job["laptop"] and player["laptop"] != job["laptop"]:
        add_log(f"❌ Нужен ноутбук «{job['laptop']}» для работы «{name}»!")
        return RedirectResponse("/?tab=work&worktab=career", status_code=303)
    player["job"] = name
    add_log(f"🎉 Вы устроились на новую работу: {name}!")
    return RedirectResponse("/?tab=work&worktab=career", status_code=303)


@app.post("/buy_home")
def buy_home(name: str = Form()):
    home = next((h for h in homes if h["name"] == name), None)
    if not home:
        add_log("❌ Такого жилья нет!")
        return RedirectResponse("/?tab=shop&store=cygan", status_code=303)
    if player["money"] < home["price"]:
        add_log("Недостаточно денег")
        return RedirectResponse("/?tab=shop&store=cygan", status_code=303)
    player["money"] -= home["price"]
    player["home"] = name
    add_log("Куплено!")
    return RedirectResponse("/?tab=shop&store=cygan", status_code=303)


@app.post("/buy_transport")
def buy_transport(name: str = Form()):
    item = next((t for t in transport if t["name"] == name), None)
    if not item:
        add_log("❌ Такого транспорта нет!")
        return RedirectResponse("/?tab=shop&store=korita", status_code=303)
    if player["money"] < item["price"]:
        add_log("Недостаточно денег")
        return RedirectResponse("/?tab=shop&store=korita", status_code=303)
    player["money"] -= item["price"]
    player["transport"] = name
    add_log("Куплено!")
    return RedirectResponse("/?tab=shop&store=korita", status_code=303)


@app.get("/homes")
def homes_redirect():
    return RedirectResponse("/?tab=shop&store=cygan", status_code=307)


@app.get("/transport")
def transport_redirect():
    return RedirectResponse("/?tab=shop&store=korita", status_code=307)


@app.get("/")
def index(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "player": player,
            "jobs": jobs,
            "laptops": laptops,
            "homes": homes,
            "transport": transport,
            "log": log,
            "music_tracks_json": json.dumps(music_tracks()),
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
