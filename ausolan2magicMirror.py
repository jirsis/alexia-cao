import requests
from pathlib import Path
import json
from tqdm import tqdm
import argparse

import ausolan
import magicmirror as mm2

from requests_toolbelt.utils import dump

def logging_hook(response, *args, **kwargs):
    data = dump.dump_all(response)
    print(data.decode('utf-8'))

class ToFile():
    @staticmethod
    def persist_file(data, base_path='ausolan', path='', filename='raw-file.json'):
        Path(base_path, path).mkdir(parents=True, exist_ok=True)
        with open(Path(base_path, path, filename), 'w') as file:
            json.dump(data, file, indent=4)

class Months():
    @staticmethod
    def month_to_number(month):
        months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
        number = -1
        for i, m in zip(range(1, 13), months): 
            if(m == month):
                number = i
        return number


if __name__ == '__main__':

    parser = argparse.ArgumentParser(
                    prog='ausolan2magicMirror',
                    description='Procesa el menú publicado en Ausolan y lo transforma al formato que necesita el módulo de MagicMirror2 alexia-cao')
    parser.add_argument('-n', '--next_month', action='store_true', help='recupera el próximo mes o el actual, [True]', default=False)
    args = parser.parse_args()

    print('[ ] Generando menu para el módulo de MagicMirror2 de alexia-cao...')
    ausolan = ausolan.Ausolan(next_month=args.next_month)
    
    ausolan.home()
    ausolan.login()
    ausolan.get_menu()
    menu=ausolan.get_monthly_menu()    
    ausolan.get_all_dishes(menu)
    magicMirror = mm2.MagicMirror(menu, ausolan.year, ausolan.month)
    magicMirror.generate()
    ausolan.show_git_instructions(ausolan.year, ausolan.month)