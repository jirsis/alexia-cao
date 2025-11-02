import ausolan2magicMirror as commons

class MagicMirror():
    def __init__(self, menu, year, month):
        self.menu = menu
        self.year = year
        self.month =  commons.Months.month_to_number(month)

    def generate(self):
        print('[ ] generando json para magic mirror 2')
        menu = []
        for day in self.menu['listadoPlatos']:
            menu.append(self.fill_menu_day(
                day=self.fecha(day['fecha']), 
                first_dish=self.primerPlato(day['primerosPlatos']), 
                main_dish=self.segundoPlato(day['segundosPlatos']).capitalize(),
                dessert=self.postre(day['pan']['nombrePlato'], day['postres'][0]['nombrePlato']).capitalize()
            ))
            self.primerPlato(day['primerosPlatos'])
        commons.ToFile.persist_file(data=menu, path="..", filename=f'menu-{self.month}.json')
    
    def fecha(self, day):
        return int(day.split('-')[2])
    
    def postre(self, pan, postre):
        return f'{pan}, {postre}'
    
    def segundoPlato(self, segundo):
        plato = segundo[0]['nombrePlato']
        guarnicion = ''
        for guarniciones in segundo[1:]:
            guarnicion += f"+ {guarniciones['nombrePlato']} "
        comida = f'{plato} {guarnicion}'
        return comida

    def primerPlato(self, primero):
        primeros=[]
        for plato in primero:
            primeros.append(plato['nombrePlato'].capitalize())
        return " | ".join(primeros)

    
    def fill_menu_day(self, day, first_dish, main_dish, dessert = ''):
        if main_dish == 'Vacaciones' or main_dish == 'No lectivo':
            dessert = ''
        
        print(f'  [{day}] - {first_dish} / {main_dish} -> {dessert}')

        return {
            "day": day,  
            "month": str(self.month),
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
