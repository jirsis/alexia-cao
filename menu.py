from datetime import datetime
from pathlib import Path
import requests
import bs4 as bs


def get_cookie():
  form_data = {
    'contrasenaCentro': '',
    'idProvincia': '',
    'nombreCentro': '',
    'idCentro': '',
    'codigoAccesoCentro': 9337,
    'codigoAccesoCentroPopup': '',
    'contrasenaCentroPopup': ''
  }
  headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
  }

  response = requests.post('https://menuak.ausolan.com/home', data=form_data, headers=headers, allow_redirects=False)
  cookie = response.headers['set-cookie'].split(';')[0]
  menu_centro_url = response.headers['location']
  return cookie, menu_centro_url

def get_menu_id(cookie, url):
  headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Accept': '*/*',
    'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
    'Accept-Encoding': 'gzip, deflate, br',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
    'Origin': 'https://menuak.ausolan.com',
    'Connection': 'keep-alive',
    'Referer': 'https://menuak.ausolan.com/home',
    'Cookie': cookie
  }
  response = requests.get(url)
  soup = bs.BeautifulSoup(response.text, 'html.parser')
  turnos = soup.find_all('#turno > option:nth-child(2)')
  print(turnos)
  for turno in turnos:
    print(turno)



# ask new month
# create new month dir
# download full menu in month dir
# create platos directories
# download all platos
#

#menu_month = input("qué mes quieres bajar? [abril]: ")
menu_month = 'abril'
menu_year = datetime.now().year
menu_date = f'{menu_year}-{menu_month}'

raw_menu = Path('raw-menu') / menu_date
raw_menu.mkdir(parents=True, exist_ok=True)

cookie, menu_centro_url = get_cookie()
print(cookie)
print(menu_centro_url)

menu_id = get_menu_id(cookie, menu_centro_url)

