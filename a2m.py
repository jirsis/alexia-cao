import argparse
from babel.dates import format_date, format_datetime, format_time
import calendar
from collections import defaultdict
from datetime import datetime, timedelta
import json
import logging
import pathlib
import requests
from tqdm import tqdm


class A2M:

    def __init__(self, today):
        self.today = today
        self.now = datetime.now().isoformat()
        self.last_day_of_month = calendar.monthrange(self.today.year, self.today.month)[1]
        self.current_month=format_date(today, "MMMMYYYY", locale='es')
        self.current_month_numeric=today.month
        self.school_code = 9337
        self.menu_path=pathlib.Path('ausolan', self.current_month)
        self.menu = []
        self.days_off_raw = []
        self.menu_raw = []
        
    def load_month(self):
        menu_path = self.menu_path.joinpath(f'{self.current_month}.json')
        print(str(menu_path.absolute()))
        with open(str(menu_path.absolute()), 'r') as menu_json:
            menu = json.load(menu_json)
            self.menu_raw=menu

    def load_parties(self):
        parties_path = self.menu_path.joinpath(f'festivos-{self.current_month}.json')
        print(str(parties_path.absolute()))
        with open(str(parties_path.absolute()), 'r') as parties_json:
            parties = json.load(parties_json)
            self.days_off_raw=parties
    
    def load_scheduled(self):
        scheduled_path = self.menu_path.joinpath(f'planificacion-{self.current_month}.json')
        print(str(scheduled_path.absolute()))
        with open(str(scheduled_path.absolute()), 'r') as scheduled_json:
            scheduled = json.load(scheduled_json)
            self.scheduled_raw=scheduled

    def generate_month(self):
        self.menu = [{
            'year': f'{self.today.year}',
            'month': f'{self.today.month}' if self.today.month >= 10 else f'0{self.today.month}',
            'day': f'{day}' if day >= 10 else f'0{day}',
            'day-of-week': self.today.replace(day=day).weekday()+1,
            'platos': []
            } for day in range(1, self.last_day_of_month+1)]
        self._mark_days_off()
        self._mark_rotations()
        self._get_menu_day()

    def magic_mirror_format(self):
        magic_mirror_menu = []

        for day in self.menu:
            magic_mirror_menu.append(
                {
                    "day": self._day(day),
                    "month": self._month(day),
                    "firstDish": {  
                        "label": self._first_dish(day),  
                        "quality": -2  
                    },  
                    "secondDish": {  
                        "label": self._main_dish(day),
                        "quality": -2  
                    },  
                    "dessertDish": {  
                        "label": self._dessert(day),  
                        "quality": -2  
                    },  
                    "nap": {  
                        "label": "",  
                        "quality": -2  
                    },  
                    "snack": {  
                        "label": "",  
                        "quality": -2  
                    },  
                    "deposiciones": {  
                        "label": "",  
                        "quality": -2  
                    },  
                    "teacherComments": "Hoy todavía no han comentado nada"  
                }
            )
        with open(f'menu-{self.current_month_numeric}.json', 'w', encoding='utf-8') as file:
            json.dump(magic_mirror_menu, file, indent=2, ensure_ascii=False)
            self.magic_mirror_menu = magic_mirror_menu

    def _month(self, menu):
        return str(self.current_month_numeric)

    def _day(self, menu):
        return int(menu['day'])

    def _first_dish(self, menu):
        if menu['off-day']:
            if menu['day-of-week'] in (6, 7):
                return 'Fin'
            else:
                return ''
        else:
            dishes = [ d for d in menu['platos'] if d['ordenPlato'] == 2 ]
            dishes.sort(key=lambda d: d['tipoOpcionPlato']['orden'])
            return ' | '.join(d['nombre'] for d in dishes)
    
    def _main_dish(self, menu):
        if menu['off-day']:
            if menu['day-of-week'] in (6, 7):
                return 'de'
            else:
                return 'Vacaciones'
        else:
            dishes = [ d for d in menu['platos'] if d['ordenPlato'] == 3 ]
            dishes.sort(key=lambda d: d['tipoOpcionPlato']['orden'])
            dishes = ' | '.join(d['nombre'] for d in dishes)
            sides = [ d for d in menu['platos'] if d['ordenPlato'] == 4 ]
            sides.sort(key=lambda d: d['tipoOpcionPlato']['orden'])
            sides = ' + '.join(d['nombre'] for d in sides)
            return f'{dishes} + {sides}'
    
    def _dessert(self, menu):
        if menu['off-day']:
            if menu['day-of-week'] in (6, 7):
                return 'semana'
            else:
                return ''
        else:
            bread = [ d for d in menu['platos'] if d['ordenPlato'] == 7 ]
            bread.sort(key=lambda d: d['tipoOpcionPlato']['orden'])
            bread = ' | '.join(d['nombre'] for d in bread)
            dessert = [ d for d in menu['platos'] if d['ordenPlato'] == 6 ]
            dessert.sort(key=lambda d: d['tipoOpcionPlato']['orden'])
            dessert = ' | '.join(d['nombre'] for d in dessert)
            return f'{bread}, {dessert}'
            
    def _get_menu_day(self):
        current_day = self.today.replace(day=1)
        for _ in range(0, self.last_day_of_month):
            day_of_month = format_date(current_day, 'dd', locale='es')
            daily_menu = next((menu for menu in self.menu if menu['day'] == day_of_month))  
            if not daily_menu['off-day']:
                dishes = [
                    dish for dish in self.menu_raw['platos']
                    if all([
                        dish['rotacion'] == daily_menu['rotation'],
                        dish['diaSemana'] == daily_menu['day-of-week']
                        ])
                ]
                dishes.sort(key = lambda d: d['ordenPlato'])
                daily_menu['platos'] = dishes
                self.menu = [ daily_menu if m['day'] == day_of_month else m for m in self.menu]
            current_day = current_day + timedelta(days=1)

    def _mark_rotations(self):
        first_rotation = self._find_min_rotation()
        self.weeks = first_rotation
        for day in self.menu:
            if day['off-day']:
                day['rotation'] = -1
            else:
                day['rotation'] = self.weeks

            if day['day-of-week'] == 7: 
                self.weeks = self.weeks + 1


    def _find_min_rotation(self):
        return self.menu_raw['rotacionActiva']

    def _mark_days_off(self):
        for day in self.menu:
            date = f"{day['year']}-{day['month']}-{day['day']}T00:00:00"
            day_off = any(off['fecha'] == date and off['nombre'] == 'DiaFestivo' for off in self.days_off_raw)
            day['off-day'] = day_off

    def show_menu(self):
        print(f'current month: {self.current_month}')
        for menu in self.magic_mirror_menu:
            print(f"* {menu['day']} {menu['firstDish']['label']} / {menu['secondDish']['label']} / {menu['dessertDish']['label']}")

    def login(self):
        url = "https://apimenuo.ausolan.com/plapi/Auth/Authenticate"
        print(f"* login at [{url}]")
        headers = { 
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0", 
            "Accept": "application/json", 
            "Accept-Language": "es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7", 
            "Accept-Encoding": "gzip, deflate, br, zstd", 
            "Content-Type": "application/json", 
            "Access-Control-Allow-Headers": "Content-Type", 
            "Origin": "https://menuo.ausolan.com", 
            "Referer": "https://menuo.ausolan.com/" } 
        data = { 
            "password": self.school_code, 
            "date": self.now, 
            "fromUrl": False 
            }
        
        response = requests.post(url, headers=headers, data=json.dumps(data), allow_redirects=True)
        if response.status_code != 200:
            raise ConnectionError
        
        print("* login ok", response.status_code)
        self.token=response.json().get('token')

    def create_raw_directory(self):
        print("* create directory")
        self.menu_path.mkdir(exist_ok=True)

    def download_month(self):
        print("* download month menu")
        url = 'https://apimenuo.ausolan.com/plapi/Centros/GetMenu?' \
        'centroPk=02190099fe8749d78a94b2e400f2972e&' \
        'centroEnvioPk=017ad231286441f0a7abb3b600f34e15&' \
        f'menuDate={self.now}&' \
        'dietaPk=d12fe25a9bbd49239e3cd65eef62e7c5&' \
        'idiomaPk=undefined'

        headers = {
            'Host': 'apimenuo.ausolan.com',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0',
            'Accept': 'application/json',
            'Accept-Language': 'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Content-type': 'application/json',
            'Authorization': f'Bearer {self.token}',
            'Origin': 'https://menuo.ausolan.com',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Referer': 'https://menuo.ausolan.com/',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site'
        }

        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            with open(pathlib.Path(self.menu_path, f'{self.current_month}.json'), 'w') as file:
                 json.dump(response.json(), file, indent=2, ensure_ascii=False)

    def download_parties(self):
        print("* download parties")
        url='https://apimenuo.ausolan.com/plapi/Centros/GetFestivos?' \
        'calendarioOficialPk=undefined&' \
        'calendarioParticularPk=63c9aca94a5d402b8ddcb3b600f39eff' \
        f'&date={self.now}'
        headers = {
            'Host': 'apimenuo.ausolan.com',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0',
            'Accept': 'application/json',
            'Accept-Language': 'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Content-type': 'application/json',
            'Authorization': f'Bearer {self.token}',
            'Origin': 'https://menuo.ausolan.com',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Referer': 'https://menuo.ausolan.com/',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site'
        }
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            with open(pathlib.Path(self.menu_path, f'festivos-{self.current_month}.json'), 'w') as file:
                 json.dump(response.json(), file, indent=2, ensure_ascii=False)

    def download_scheduled(self):
        print("* download scheduled")
        start_date = datetime.today().replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
        end_date = datetime.today() + timedelta(days=32)
        end_date = end_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()

        url='https://apimenuo.ausolan.com/plapi/Centros/GetPlanificacion?' \
        'previsionPk=2eabab7063ee4f91bde8b3b600f40539&' \
        'centroEnvioPk=017ad231286441f0a7abb3b600f34e15&' \
        'dietaPk=d12fe25a9bbd49239e3cd65eef62e7c5&' \
        f'fechaInicio={start_date}Z&' \
        f'fechaFin={end_date}Z&' \
        'idiomaPk=00242C08E94B10101810432101271385'
        headers = {
            'Host': 'apimenuo.ausolan.com',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0',
            'Accept': 'application/json',
            'Accept-Language': 'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Content-type': 'application/json',
            'Authorization': f'Bearer {self.token}',
            'Origin': 'https://menuo.ausolan.com',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Referer': 'https://menuo.ausolan.com/',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site'
        }
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            with open(pathlib.Path(self.menu_path, f'planificacion-{self.current_month}.json'), 'w') as file:
                 json.dump(response.json(), file, indent=2, ensure_ascii=False)
    


if __name__ == '__main__':
    print("ausolan -> magic mirror")
    parser = argparse.ArgumentParser(
                    prog='a2m',
                    description='Procesa el menú publicado en Ausolan y lo transforma al formato que necesita el módulo de MagicMirror2 alexia-cao')
    parser.add_argument('-n', '--next_month', action='store_true', help='recupera el próximo mes o el actual, [True]', default=False)
    args = parser.parse_args()
    
    from http.client import HTTPConnection
    HTTPConnection.debuglevel = 0

    logging.basicConfig() # you need to initialize logging, otherwise you will not see anything from requests
    logging.getLogger().setLevel(logging.DEBUG)
    requests_log = logging.getLogger("urllib3")
    requests_log.setLevel(logging.INFO)
    requests_log.propagate = True

    a2m = A2M(datetime.today().replace(day=1))
    a2m.login()
    a2m.create_raw_directory()
    a2m.download_month()
    a2m.load_month()
    a2m.download_parties()
    a2m.load_parties()
    a2m.download_scheduled()
    a2m.load_scheduled()
    a2m.generate_month()
    a2m.magic_mirror_format()
    a2m.show_menu()
    