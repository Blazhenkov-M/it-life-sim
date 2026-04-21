import random
from pathlib import Path
from urllib.parse import quote

from fastapi import FastAPI
from fastapi.encoders import jsonable_encoder
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

BASE_DIR = Path(__file__).parent
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"

app = FastAPI()
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
    {"name": "Общага", "price": 0},
    {"name": "Съёмная хата", "price": 300},
    {"name": "Своя квартира", "price": 1000},
]

transport = [
    {"name": "Пешком", "price": 0, "work_bonus": 0},
    {"name": "Самокат", "price": 200, "work_bonus": 10},
    {"name": "Электросамокат", "price": 800, "work_bonus": 25},
    {"name": "Жига", "price": 1500, "work_bonus": 40},
]

FUN_ACTIVITIES = [
    {"id": "walk", "title": "Прогулка", "price": 0, "mood": 5},
    {"id": "beer", "title": "Выпить пива", "price": 200, "mood": 25},
    {"id": "sauna", "title": "Сходить в сауну", "price": 5000, "mood": 70},
]


def fun_activity_by_id(activity_id: str) -> dict | None:
    return next((a for a in FUN_ACTIVITIES if a["id"] == activity_id), None)


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


def state_payload() -> dict:
    return {
        "player": dict(player),
        "log": list(log),
        "jobs": [{**j, "income": list(j["income"])} for j in jobs],
        "laptops": laptops,
        "homes": homes,
        "transport": transport,
        "fun_activities": FUN_ACTIVITIES,
        "music_tracks": music_tracks(),
    }


class FunPayload(BaseModel):
    activity: str = ""


class NamePayload(BaseModel):
    name: str = ""


def do_work() -> None:
    if player["energy"] < 15:
        add_log("❌ Не хватает энергии для работы!")
        return

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


def do_fun(activity_id: str) -> None:
    act = fun_activity_by_id(activity_id)
    if not act:
        add_log("❌ Такого развлечения нет!")
        return
    if player["money"] < act["price"]:
        add_log(f"❌ Не хватает денег на «{act['title']}»! Нужно {act['price']}₽.")
        return

    player["mood"] = clamp(player["mood"] + act["mood"])
    player["money"] -= act["price"]
    if act["price"]:
        add_log(f"🎉 {act['title']}! Настроение +{act['mood']}, −{act['price']}₽.")
    else:
        add_log(f"🎉 {act['title']}! Настроение +{act['mood']}.")


def do_buy_laptop(name: str) -> None:
    laptop = next((l for l in laptops if l["name"] == name), None)
    if not laptop:
        add_log("❌ Такого ноутбука не существует!")
        return
    if player["money"] < laptop["price"]:
        add_log(f"❌ Недостаточно денег на {name}! Нужно {laptop['price']}₽.")
        return
    player["money"] -= laptop["price"]
    player["laptop"] = name
    add_log(f"💻 Купил {name} за {laptop['price']}₽!")


def do_apply_job(name: str) -> None:
    job = next((j for j in jobs if j["name"] == name), None)
    if not job:
        add_log("❌ Такой работы не существует!")
        return
    if player["level"] < job["min_level"]:
        add_log(f"❌ Недостаточно уровня для «{name}»! Нужен {job['min_level']}.")
        return
    if job["laptop"] and player["laptop"] != job["laptop"]:
        add_log(f"❌ Нужен ноутбук «{job['laptop']}» для работы «{name}»!")
        return
    player["job"] = name
    add_log(f"🎉 Вы устроились на новую работу: {name}!")


def do_buy_home(name: str) -> None:
    home = next((h for h in homes if h["name"] == name), None)
    if not home:
        add_log("❌ Такого жилья нет!")
        return
    if player["money"] < home["price"]:
        add_log("Недостаточно денег")
        return
    player["money"] -= home["price"]
    player["home"] = name
    add_log("Куплено!")


def do_buy_transport(name: str) -> None:
    item = next((t for t in transport if t["name"] == name), None)
    if not item:
        add_log("❌ Такого транспорта нет!")
        return
    if player["money"] < item["price"]:
        add_log("Недостаточно денег")
        return
    player["money"] -= item["price"]
    player["transport"] = name
    add_log("Куплено!")


@app.get("/api/state")
def api_state():
    return JSONResponse(content=jsonable_encoder(state_payload()))


@app.post("/api/work")
def api_work():
    do_work()
    return JSONResponse(content=jsonable_encoder(state_payload()))


@app.post("/api/fun")
def api_fun(body: FunPayload):
    do_fun(body.activity)
    return JSONResponse(content=jsonable_encoder(state_payload()))


@app.post("/api/buy_laptop")
def api_buy_laptop(body: NamePayload):
    do_buy_laptop(body.name)
    return JSONResponse(content=jsonable_encoder(state_payload()))


@app.post("/api/apply_job")
def api_apply_job(body: NamePayload):
    do_apply_job(body.name)
    return JSONResponse(content=jsonable_encoder(state_payload()))


@app.post("/api/buy_home")
def api_buy_home(body: NamePayload):
    do_buy_home(body.name)
    return JSONResponse(content=jsonable_encoder(state_payload()))


@app.post("/api/buy_transport")
def api_buy_transport(body: NamePayload):
    do_buy_transport(body.name)
    return JSONResponse(content=jsonable_encoder(state_payload()))


@app.get("/homes")
def homes_redirect():
    return RedirectResponse("/?tab=shop&store=cygan", status_code=307)


@app.get("/transport")
def transport_redirect():
    return RedirectResponse("/?tab=shop&store=korita", status_code=307)


if FRONTEND_DIST.is_dir() and (FRONTEND_DIST / "assets").is_dir():
    app.mount(
        "/assets",
        StaticFiles(directory=FRONTEND_DIST / "assets"),
        name="assets",
    )


@app.get("/")
def index():
    index_path = FRONTEND_DIST / "index.html"
    if not index_path.is_file():
        return JSONResponse(
            status_code=503,
            content={
                "detail": "Frontend not built. Run: cd frontend && npm install && npm run build",
            },
        )
    return FileResponse(index_path, media_type="text/html; charset=utf-8")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
