import os
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


ROOT = Path(__file__).resolve().parent
SCREENSHOT_DIR = ROOT / "test-artifacts"
SCREENSHOT_DIR.mkdir(exist_ok=True)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://127.0.0.1:5173")


def check_viewport(page, width, height, name):
    page.set_viewport_size({"width": width, "height": height})
    page.goto(FRONTEND_URL)
    page.wait_for_load_state("networkidle")

    expect(page.get_by_label("Primary navigation")).to_be_visible()
    expect(page.get_by_label("Workspace explorer")).to_be_visible()
    expect(page.get_by_text("Requirement.docx").first).to_be_visible()
    expect(page.get_by_text("AI analyst")).to_be_visible() if width >= 1180 else None
    expect(page.get_by_text("Gap detected")).to_be_visible()
    expect(page.get_by_role("button", name="Open command palette")).to_be_visible()

    overflow = page.evaluate(
        "() => document.documentElement.scrollWidth > document.documentElement.clientWidth"
    )
    assert not overflow, f"Horizontal overflow detected at {width}x{height}"

    page.screenshot(path=str(SCREENSHOT_DIR / f"{name}.png"), full_page=True)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    check_viewport(page, 1440, 1000, "knowledge-ide-desktop")
    check_viewport(page, 390, 920, "knowledge-ide-mobile")
    browser.close()
