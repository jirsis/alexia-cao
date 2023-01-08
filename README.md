# alexia-cao
Show Colegio Alameda de Osuna menu information in MagicMirror2

## Menu source
The module use the main information available in the [school website](https://www.colegio-alameda.com/comedor/)
At this moment only show the 'Menú de comedor' information.

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
	{
		module: "alexia-cao",
		position: "bottom_right",	// This can be any of the regions. Best results in left or right regions.
		config: {
            // The config property is optional.
			// If no config is set, an example emt is shown.
            // See 'Configuration options' for more information.
            // Only mandatory configuration are the credential to retrive the information.
		}
	}
]
````

## Configuration options

The following properties can be configured:

| Option                       | Description
| ---------------------------- | -----------
| `course`                     | Label to show in the header module. <br><br> **Possible values:** `"Inf. 1B"`<br> **Default value:** `<empty>`
