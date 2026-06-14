from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        args=[
            "--use-gl=angle",
            "--use-angle=swiftshader",
            "--enable-unsafe-swiftshader",
            "--ignore-gpu-blocklist",
        ],
    )
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://localhost:5173/moodboard")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2500)  # let textures load + sphere render
    page.screenshot(path="C:/Users/miche/Asterism/.superpowers/moodboard_home.png")
    browser.close()
    print("done")
