import random
from fastapi import FastAPI
from fastapi.responses import HTMLResponse, RedirectResponse

app = FastAPI()

player = {
    "energy": 100,
    "mood": 100,
    "money": 100,
    "xp": 0,
    "level": 1,
}

log: list[str] = []


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
        return RedirectResponse("/", status_code=303)

    earned = random.randint(40, 80)
    player["energy"] = clamp(player["energy"] - 15)
    player["mood"] = clamp(player["mood"] - 5)
    player["money"] += earned
    player["xp"] += 10
    add_log(f"💻 Поработал. Заработал {earned}₽, получил 10 XP.")
    check_level_up()
    return RedirectResponse("/", status_code=303)


@app.post("/rest")
def rest():
    player["energy"] = clamp(player["energy"] + 25)
    player["mood"] = clamp(player["mood"] + 10)
    add_log("😴 Отдохнул. Энергия +25, настроение +10.")
    return RedirectResponse("/", status_code=303)


@app.post("/fun")
def fun():
    if player["money"] < 20:
        add_log("❌ Не хватает денег на развлечения!")
        return RedirectResponse("/", status_code=303)

    player["mood"] = clamp(player["mood"] + 20)
    player["money"] -= 20
    add_log("🎮 Развлёкся! Настроение +20, деньги -20.")
    return RedirectResponse("/", status_code=303)


def bar(value: int, color: str) -> str:
    pct = clamp(value)
    return (
        f'<div style="background:#eee;border-radius:6px;height:18px;width:200px;display:inline-block;vertical-align:middle">'
        f'<div style="background:{color};height:100%;width:{pct}%;border-radius:6px"></div>'
        f'</div> {value}'
    )


@app.get("/", response_class=HTMLResponse)
def index():
    log_html = "".join(f"<li>{entry}</li>" for entry in reversed(log))

    work_disabled = "disabled" if player["energy"] < 15 else ""
    fun_disabled = "disabled" if player["money"] < 20 else ""

    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Симулятор айтишника</title>
<style>
  body {{ font-family: system-ui, sans-serif; max-width: 480px; margin: 40px auto; padding: 0 16px; background: #f7f7f9; color: #222; }}
  h1 {{ text-align: center; }}
  .stats {{ background: #fff; padding: 16px 20px; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }}
  .stat {{ margin: 8px 0; }}
  .label {{ display: inline-block; width: 100px; font-weight: 600; }}
  .actions {{ display: flex; gap: 8px; margin: 20px 0; }}
  .actions form {{ flex: 1; }}
  button {{ width: 100%; padding: 10px; font-size: 15px; border: none; border-radius: 8px; cursor: pointer; background: #4f46e5; color: #fff; }}
  button:hover:not(:disabled) {{ background: #4338ca; }}
  button:disabled {{ opacity: .45; cursor: not-allowed; }}
  .log {{ background: #fff; padding: 16px 20px; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,.08); margin-top: 16px; }}
  .log ul {{ padding-left: 18px; margin: 8px 0 0; }}
  .log li {{ margin: 4px 0; }}
</style>
</head>
<body>
<h1>🧑‍💻 Симулятор айтишника</h1>

<div class="stats">
  <div class="stat"><span class="label">⚡ Энергия</span> {bar(player["energy"], "#22c55e")}</div>
  <div class="stat"><span class="label">😊 Настроение</span> {bar(player["mood"], "#3b82f6")}</div>
  <div class="stat"><span class="label">💰 Деньги</span> {player["money"]}₽</div>
  <div class="stat"><span class="label">✨ Опыт</span> {player["xp"]} / {player["level"] * 100} XP</div>
  <div class="stat"><span class="label">📈 Уровень</span> {player["level"]}</div>
</div>

<div class="actions">
  <form method="post" action="/work"><button {work_disabled}>💻 Работать</button></form>
  <form method="post" action="/rest"><button>😴 Отдыхать</button></form>
  <form method="post" action="/fun"><button {fun_disabled}>🎮 Развлечься</button></form>
</div>

<div class="log">
  <strong>📜 Последние действия:</strong>
  <ul>{log_html if log_html else "<li>Пока ничего не произошло...</li>"}</ul>
</div>
</body>
</html>"""


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
