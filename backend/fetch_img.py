import urllib.request
import re

url = "https://www.google.com/search?q=AAIT+library&rlz=1C1GCEA_enET1104ET1104&oq=AAIT+library&gs_lcrp=EgZjaHJvbWUyBggAEEUYOdIBCDI4MzRqMGo3qAIIsAIB8QVI1AOEDJeLvg&sourceid=chrome&ie=UTF-8"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        matches = re.findall(r'https://lh5\.googleusercontent\.com/p/[a-zA-Z0-9_-]+', html)
        if not matches:
            matches = re.findall(r'https://lh3\.googleusercontent\.com/p/[a-zA-Z0-9_-]+', html)
        if matches:
            print("FOUND:", matches[0])
        else:
            print("No image found")
except Exception as e:
    print("Error:", e)
