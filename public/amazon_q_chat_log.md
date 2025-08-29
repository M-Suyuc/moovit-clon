# Chat Log - Amazon Q ASCII Art

## Pregunta Original:
**Usuario:** dime como se hace eso del logo se arriba de Amazon Q en la terminal solo dime como se hace ?

## Respuesta:
Para crear un logo ASCII como el de Amazon Q en la terminal, puedes usar varias herramientas:

### Herramientas para generar ASCII art:

**1. figlet** (más común):
```bash
# Instalar figlet
sudo apt install figlet  # Ubuntu/Debian
brew install figlet      # macOS

# Usar figlet
figlet "Amazon Q"
figlet -f slant "Amazon Q"
```

**2. toilet** (más opciones de estilo):
```bash
sudo apt install toilet
toilet -f mono12 "Amazon Q"
```

**3. Generadores online:**
- https://patorjk.com/software/taag/
- https://www.ascii-art-generator.org/

### En tu código:

Una vez que tengas el ASCII art, simplemente lo imprimes al inicio:

```javascript
console.log(`
 █████╗ ███╗   ███╗ █████╗ ███████╗ ██████╗ ███╗   ██╗     ██████╗ 
██╔══██╗████╗ ████║██╔══██╗╚══███╔╝██╔═══██╗████╗  ██║    ██╔═══██╗
███████║██╔████╔██║███████║  ███╔╝ ██║   ██║██╔██╗ ██║    ██║   ██║
██╔══██║██║╚██╔╝██║██╔══██║ ███╔╝  ██║   ██║██║╚██╗██║    ██║▄▄ ██║
██║  ██║██║ ╚═╝ ██║██║  ██║███████╗╚██████╔╝██║ ╚████║    ╚██████╔╝
╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝     ╚══▀▀═╝ 
`);
```

El truco está en elegir una fuente que se vea bien y ajustar el tamaño según tu terminal.

---
*Chat guardado el: 2025-08-20*
