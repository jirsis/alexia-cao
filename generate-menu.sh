#!/bin/bash

if [ $# -ne 1 ]; then
	echo "$0 <month>"
	exit
fi

month=$1

nextDay=true

menuFile="menu-$month.json"
echo "[" > $menuFile

while $nextDay ; do

	echo -n "dia: " 
	read day

	echo -n "primer plato: "
	read firstDish

	echo -n "segundo plato: "
	read secondDish

	echo -n "postre: "
	read dessert

	cat <<EOF >>$menuFile
	{
       "day": $day,  
       "month": $month,  
       "firstDish": {  
         "label": "$firstDish",  
         "quality": -2  
       },  
       "secondDish": {  
         "label": "$secondDish",  
         "quality": -2  
       },  
       "dessertDish": {  
         "label": "$dessert",  
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
       "teacherComments": "Hoy todavía no han comentado nada"  
    },
EOF

	echo -n "siguiente día? "
	read nextDay
	

done


echo "]" >> $menuFile
