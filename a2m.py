import argparse
from babel.dates import format_date, format_datetime, format_time
import calendar
from collections import defaultdict
from datetime import datetime
import json
import pathlib
from tqdm import tqdm

class A2M:

    def __init__(self, today):
        self.today = today
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

    def generate_month(self):
        last_day = calendar.monthrange(self.today.year, self.today.month)[1]
        self.menu = [{
            'year': f'{self.today.year}',
            'month': f'{self.today.month}' if self.today.month >= 10 else f'0{self.today.month}',
            'day': f'{day}' if day >= 10 else f'0{day}',
            'day-of-week': self.today.replace(day=day).weekday()+1,
            'platos': []
            } for day in range(1, last_day+1)]
        self._mark_days_off()
        self._mark_rotations()
        self._get_menu_day()

    def magic_mirror_format(self):
        magic_mirror_menu = []

        for menu in self.menu:
            magic_mirror_menu.append(
                {
                    "day": self._day(menu),
                    "month": self._month(menu),
                    "firstDish": {  
                        "label": self._first_dish(menu),  
                        "quality": -2  
                    },  
                    "secondDish": {  
                        "label": self._main_dish(menu),
                        "quality": -2  
                    },  
                    "dessertDish": {  
                        "label": self._dessert(menu),  
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
        if menu['rotation'] == -1:
            return 'no'
        else:
            dishes = [ d for d in menu['platos'] if d['orden'] == 2 ]
            dishes.sort(key=lambda d: d['option'])
            return ' | '.join(d['nombre'] for d in dishes)
            
    
    def _main_dish(self, menu):
        if menu['rotation'] == -1:
            return 'lectivo'
        else:
            dishes = [ d for d in menu['platos'] if d['orden'] == 3 ]
            dishes.sort(key=lambda d: d['option'])
            dishes = ' | '.join(d['nombre'] for d in dishes)
            sides = [ d for d in menu['platos'] if d['orden'] == 4 ]
            sides.sort(key=lambda d: d['option'])
            sides = ' + '.join(d['nombre'] for d in sides)
            return f'{dishes} + {sides}'
    
    def _dessert(self, menu):
        if menu['rotation'] != -1:
            bread = [ d for d in menu['platos'] if d['orden'] == 7 ]
            bread.sort(key=lambda d: d['option'])
            bread = ' | '.join(d['nombre'] for d in bread)
            dessert = [ d for d in menu['platos'] if d['orden'] == 6 ]
            dessert.sort(key=lambda d: d['option'])
            dessert = ' | '.join(d['nombre'] for d in dessert)
            return f'{bread}, {dessert}'
            

    def _get_menu_day(self):
        for week in range(0, self.weeks):
            for week_day in range(calendar.MONDAY + 1, calendar.SUNDAY):
                platos_raw = [
                    plato for plato in self.menu_raw['platos']
                    if all([
                        plato.get("rotacion") == week+1,
                        plato.get("diaSemana") == week_day
                        ])
                ] 
                platos_raw.sort(key=lambda p: p['ordenPlato'])
                for plato_raw in platos_raw:
                    resultado = next( (menu_item for menu_item in self.menu if menu_item["rotation"] == plato_raw['rotacion'] and menu_item["day-of-week"] == plato_raw['diaSemana']), None )
                    resultado['platos'].append({
                        'nombre': plato_raw['nombre'],
                        'orden': plato_raw['ordenPlato'], 
                        'option': plato_raw['tipoOpcionPlato']['orden']
                        })
                    self.menu = [resultado if m['rotation'] == resultado['rotation'] and m['day-of-week'] == resultado['day-of-week'] else m for m in self.menu]

    def _mark_rotations(self):
        self.weeks = 1
        for day in self.menu:
            day['rotation'] = -1 if day['day-of-week'] in (6,7) else self.weeks
            if day['day-of-week'] == 6: 
                self.weeks = self.weeks + 1

    def _mark_days_off(self):
        for day in self.menu:
            date = f"{day['year']}-{day['month']}-{day['day']}T00:00:00"
            day_off = any(off['fecha'] == date for off in self.days_off_raw)
            day['off-day'] = day_off

    def show_menu(self):
        print(f'current month: {self.current_month}')
        for menu in self.magic_mirror_menu:
            print(f"* {menu['day']} {menu['firstDish']['label']} / {menu['secondDish']['label']} / {menu['dessertDish']['label']}")

if __name__ == '__main__':
    print("ausolan -> magic mirror")
    parser = argparse.ArgumentParser(
                    prog='a2m',
                    description='Procesa el menú publicado en Ausolan y lo transforma al formato que necesita el módulo de MagicMirror2 alexia-cao')
    parser.add_argument('-n', '--next_month', action='store_true', help='recupera el próximo mes o el actual, [True]', default=False)
    args = parser.parse_args()

    a2m = A2M(datetime.today().replace(day=1))
    a2m.load_month()
    a2m.load_parties()
    a2m.generate_month()
    a2m.magic_mirror_format()
    a2m.show_menu()
    

