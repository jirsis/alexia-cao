import requests
from pathlib import Path
from tqdm import tqdm
from datetime import datetime
from dateutil.relativedelta import relativedelta

from ausolan2magicMirror import ToFile, Months

class Ausolan():
    def __init__(self, debug=False, next_month=True):
        self.code=9337
        self.url_base='https://menuak.ausolan.com'
        self.servicio_turno=11083510
        if(next_month):
            next_month = datetime.today() + relativedelta(months=1)
            month = next_month.strftime('%b')
            self.year = next_month.strftime('%Y')
        else:
            month = datetime.today().strftime('%b')
            self.year= datetime.today().strftime('%Y')

        self.date=f'{month}+05+{self.year}+00%3A00%3A00+GMT%2B0200+(hora+de+verano+de+Europa+central)'
        self.month=None
        
        self.session = requests.Session()        
        
        if(debug):
            self.session.hooks["response"] = [logging_hook]

    def home(self):
        print("[*] home")
        response = self.session.get(self.url_base)
        if(response.status_code == 200):
            print(f"[√] cookies: {self.session.cookies}")
            print("[√] home OK")
        else:
            print("[!] home KO")

    def login(self):
        print("[*] login")        
        login_data={
            'contrasenaCentro': '', 
            'idProvincia': '', 
            'nombreCentro': '', 
            'idCentro': '', 
            'codigoAccesoCentro': self.code,
            'codigoAccesoCentroPopup': '', 
            'contrasenaCentroPopup': ''
        }
        headers={}
        headers['content-type'] = 'application/x-www-form-urlencoded'
        response = self.session.post(f'{self.url_base}/home', data=login_data, headers=headers)
        print(f'[√] login {response.status_code}')

    def get_menu(self):
        print('[*] get menu')        
        headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:143.0) Gecko/20100101 Firefox/143.0',
            'Accept': '*/*',
            'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'X-Requested-With': 'XMLHttpRequest',
            'DNT': '1',
            'Sec-GPC': '1',
            'Connection': 'keep-alive',
            'Referer': 'https://menuak.ausolan.com/menu/menuCentro',            
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Priority': 'u=0',
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache',
            'TE': 'trailers'
        }        
        response = self.session.get(f'{self.url_base}/menu/cambiarServicios?idTurno={self.servicio_turno}', headers=headers)
        
        if( response.status_code == 200):
            print(f'[√] menu OK - {response.json()['nombreCentro']}')
            self.menu = response.json()['comboMenu']['idMenu']            
        else:
            print(f'[!] menu KO {response.status_code}')

    def get_monthly_menu(self):
        print('[*] get monthly menu')
        headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:143.0) Gecko/20100101 Firefox/143.0',
            'Accept': '*/*',
            'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'X-Requested-With': 'XMLHttpRequest',
            'DNT': '1',
            'Sec-GPC': '1',
            'Connection': 'keep-alive',
            'Referer': 'https://menuak.ausolan.com/menu/menuCentro',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Priority': 'u=0',
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache'
        }
        response = self.session.get(f'{self.url_base}/menu/menuMes/cargarPlatos?idMenu={self.menu}&idServicioTurno={self.servicio_turno}&calcularSiguiente=&fecha={self.date}', headers=headers, allow_redirects=False)
        if( response.status_code == 200):
            self.year = response.json()['anyo']
            self.month = response.json()['mes'].lower()
            print(f'[√] monthly menu OK - {self.month}/{self.year}')
            data = response.json()
            ToFile.persist_file(data, path=f'{self.month}{self.year}', filename=f'{self.month}{self.year}.json')
            return data
        else:
            print(f'[!] monthly menu KO {response.status_code}')
            return None
           
    def get_all_dishes(self, menu):
        dishes = {
            'primeros': [],
            'segundos': [],
            'postres': [],
            'pan': []
        }

        for dish in tqdm(menu['listadoPlatos'], desc='Separando platos'):
            for p in dish['primerosPlatos']:
                dishes['primeros'].append(p)
            for p in dish['segundosPlatos']:
                dishes['segundos'].append(p)
            for p in dish['postres']:                
                dishes['postres'].append(p)
            dishes['pan'].append(dish['pan'])
        
        for dish in tqdm(dishes['primeros'], desc='  primeros'):
            self.get_dish(dish['idPlatoVersion'], type='primeros')
        for dish in tqdm(dishes['segundos'], desc='  segundos'):
            self.get_dish(dish['idPlatoVersion'], type='segundos')
        for dish in tqdm(dishes['postres'], desc='  postres'):
            self.get_dish(dish['idPlatoVersion'], type='postres')
        for dish in tqdm(dishes['pan'], desc='  pan'):
            self.get_dish(dish['idPlatoVersion'], type='pan')


    def get_dish(self, id_dish, type='dish'):
        headers={
            'Accept': '*/*' ,
            'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'Origin': 'https://menuak.ausolan.com',
            'DNT': '1',
            'Sec-GPC': '1',
            'Connection': 'keep-alive',
            'Referer': 'https://menuak.ausolan.com/menu/menuCentro',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Priority': 'u=0',
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache',
            'TE': 'trailers'
        }
        body = {
            'idMenu': self.menu,
            'idPlatoVersion': id_dish
        }
        response = self.session.post(f'{self.url_base}/menu/cargarIngredientes', headers = headers, data = body)        
        if(response.status_code == 200):
            ToFile.persist_file(response.json(), path=Path(f'{self.month}{self.year}', type), filename=f'{id_dish}.json')
        else:
            print(f"[!] ingredientes KO - {response.status_code}")

    def show_git_instructions(self, year, month):
        print('[-] ahora ejecuta:')
        print(f'\tgit add ausolan/{month}{year}/*')
        print(f'\tgit add menu-{Months.month_to_number(month)}.json')
        print(f'\tgit commit -m "{month} {year}"')
        print(f'\tgit tag -f v0.7.0-{month[:3]}{year}')
        print('\tgit push')
        print(f'\tgit push -f origin v0.7.0-{month[:3]}{year}')

