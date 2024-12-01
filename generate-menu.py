import calendar
from datetime import datetime
import json 

def fill_menu_day(day, first_dish, main_dish, dessert = 'Fruta, leche y pan'):
    if main_dish == 'Vacaciones' or main_dish == 'No lectivo':
        dessert = ''
    
    print(f'[{day}] - {first_dish} / {main_dish} -> {dessert}')

    return {
        "day": day,  
        "month": month,  
        "firstDish": {  
            "label": first_dish,  
            "quality": -2  
        },  
        "secondDish": {  
            "label": main_dish,
            "quality": -2  
        },  
        "dessertDish": {  
            "label": dessert,  
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

def fill_monthly_menu(month, menu):
    monthly_menu = []
    current_year = datetime.now().year
    for day in range(1, calendar.monthrange(current_year, int(month))[1]+1):
        date = datetime(current_year, int(month), day)
        if date.weekday() < 5:
            print(f'día: {day}')
            first_dish = input('- primer plato: ')
            main_dish = input('- segudo plato: ')
            menu_day = fill_menu_day(day=day, first_dish=first_dish, main_dish=main_dish)
            monthly_menu.append(menu_day)
    
    return monthly_menu

def writeMenuFile(json_filename, menu):
    menu_json = open(json_filename, 'w')
    pretty_json = json.dumps(menu, indent = 2)
    menu_json.write(pretty_json)
    menu_json.close()
    print(f'fichero creado [{json_filename}]')

def load_menu(menu_filename):
    print(f'-> {menu_filename}')
    with open(menu_filename) as json_file:
        data = json.load(json_file)
    json_file.close()
    return data

def segundoPlato(segundo):
    plato = segundo[0]['nombrePlato']
    guarnicion = ''
    for guarniciones in segundo[1:]:
        guarnicion += f"+ {guarniciones['nombrePlato']} "
    comida = f'{plato} {guarnicion}'
    return comida

def primerPlato(primero):
    primeros=[]
    for plato in primero:
        primeros.append(plato['nombrePlato'].capitalize())
    return " | ".join(primeros)

def postre(pan, postre):
    return f'{pan}, {postre}'

def fecha(day):
    return int(day.split('-')[2])

def web2module(menu_web):
    menu = []
    for day in menu_web['listadoPlatos']:
        menu.append(fill_menu_day(
            day=fecha(day['fecha']), 
            first_dish=primerPlato(day['primerosPlatos']), 
            main_dish=segundoPlato(day['segundosPlatos']).capitalize(),
            dessert=postre(day['pan']['nombrePlato'], day['postres'][0]['nombrePlato']).capitalize()
        ))
        primerPlato(day['primerosPlatos'])
    return menu

def num_to_month(num_month):
    months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    return months[int(num_month)-1]

if __name__ == '__main__':
    month = input(f'introduce el mes para el menú: ')
    menu_json = f'menu-{month}.json'
    print(f'menu: {menu_json}')
    month_name = num_to_month(month)
    menu_web = load_menu(f'ausolan/{month_name}2024/{month_name}2024.json')
    menu_module = web2module(menu_web)
    writeMenuFile(menu_json, menu_module)
