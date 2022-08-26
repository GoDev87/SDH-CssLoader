from css_inject import Inject
from css_themepatchcomponent import ThemePatchComponent
from css_utils import Log, Result

class ThemePatch:
    def __init__(self, theme, json : dict, name : str):
        self.json = json
        self.name = name
        self.default = json["default"]
        self.type = json["type"] if "type" in json else "dropdown"
        self.theme = theme
        self.value = self.default
        self.injects = []
        self.options = {}
        self.patchVersion = None
        self.components = []

        if "values" in json: # Do we have a v2 or a v1 format?
            self.patchVersion = 2
            for x in json["values"]:
                self.options[x] = []
        else:
            self.patchVersion = 1
            for x in json:
                if (x == "default"):
                    continue

                self.options[x] = []
        
        if self.default not in self.options:
            raise Exception(f"In patch '{self.name}', '{self.default}' does not exist as a patch option")
        
        self.load()

    def set_value(self, value):
        if isinstance(value, str):
            self.value = value
        elif isinstance(value, dict):
            if "value" in value:
                self.value = value["value"]
            
            if "components" in value:
                components = value["components"]

                if not isinstance(components, dict):
                    raise Exception("???")
                
                for x in self.components:
                    if x.name in components:
                        x.value = components[x.name]
                        x.generate()
    
    def get_value(self) -> str | dict:
        if len(self.components) <= 0:
            return self.value
        else:
            components = {}
            for x in self.components:
                components[x.name] = x.value
            
            return {
                "value": self.value,
                "components": components,
            }

    def check_value(self):
        if (self.value not in self.options):
            self.value = self.default

        if (self.type not in ["dropdown", "checkbox", "slider"]):
            self.type = "dropdown"
        
        if (self.type == "checkbox"):
            if not ("No" in self.options and "Yes" in self.options):
                self.type = "dropdown"
    
    def load(self):
        for x in self.options:
            data = self.json[x] if self.patchVersion == 1 else self.json["values"][x]

            for y in data:
                inject = Inject(self.theme.themePath + "/" + y, data[y], self.theme)
                self.injects.append(inject)
                self.options[x].append(inject)
        
        if "components" in self.json:
            for x in self.json["components"]:
                component = ThemePatchComponent(self, x)
                if component.on not in self.options:
                    raise Exception("Component references non-existent value")
                
                self.components.append(component)
                self.injects.append(component.inject)
                self.options[component.on].append(component.inject)

        self.check_value()

    async def inject(self) -> Result:
        self.check_value()
        Log(f"Injecting patch '{self.name}' of theme '{self.theme.name}'")
        for x in self.options[self.value]:
            result = await x.inject()
            if not result.success:
                return result
        
        return Result(True)

    async def remove(self) -> Result:
        self.check_value()
        Log(f"Removing patch '{self.name}' of theme '{self.theme.name}'")
        for x in self.injects:
            result = await x.remove()
            if not result.success:
                return result
        
        return Result(True)
    
    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "default": self.default,
            "value": self.value,
            "options": [x for x in self.options],
            "type": self.type,
            "components": [x.to_dict() for x in self.components]
        }