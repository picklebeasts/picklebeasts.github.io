# PickleBeasts — diseño de partidos

## Objetivo

Los partidos son el núcleo del juego. El modo principal de la carrera es dobles 2 contra 2: el jugador controla a su avatar y el compañero funciona con IA autónoma. Los individuales 1 contra 1 quedan disponibles para desafíos y entrenamientos específicos.

## Reglas deportivas de referencia

La referencia es el reglamento oficial USA Pickleball 2026:

- Pista reglamentaria de 20 × 44 pies.
- Zona de no volea (kitchen) de 7 pies a cada lado de la red.
- Saque diagonal al cuadro de servicio opuesto.
- Regla de los dos botes: el saque bota antes de la devolución y la devolución bota antes del siguiente golpe del equipo que sacó.
- Después de esos dos botes, se permite volear o jugar tras bote.
- No se puede volear pisando la kitchen ni si el impulso del jugador le lleva a tocarla.
- En puntuación tradicional solo suma puntos el equipo que está sacando.
- En dobles se anuncia la puntuación con tres cifras: puntos del equipo que saca, puntos del equipo receptor y número de servidor.
- El juego estándar llega a 11 puntos y exige ganar por dos.

Fuente: [USA Pickleball — Official Rulebook](https://usapickleball.org/rules/).

## Formato de PickleBeasts

- Los partidos normales de carrera se juegan a 11 puntos, diferencia de 2.
- La competición principal es dobles.
- En la primera fase del juego, cada partido de historia puede ser un único juego para mantener una duración adecuada al móvil.
- Los torneos pueden convertirse más adelante en series al mejor de tres.
- Los desafíos individuales tendrán reglas y objetivos propios, sin sustituir el modo dobles.

## Controles móviles

- Joystick virtual izquierdo: movimiento libre del avatar en su mitad de pista.
- Botones de golpe: Drive, Dink y Globo.
- Gesto de arrastre cuando la pelota está al alcance: dirección del golpe.
- Botón Sacar cuando el equipo del jugador tiene el servicio.
- El jugador controla solo a su avatar. El compañero y los dos rivales se mueven y golpean mediante IA.

## Comportamiento de la IA

### Compañero
- Mantiene una posición complementaria a la del jugador.
- Cubre el espacio libre y se acerca a la pelota cuando es el jugador mejor situado.
- No debe invadir la kitchen para volear.
- Su velocidad, reflejos, control y táctica afectan a su rendimiento.

### Rivales
- Se desplazan hacia la trayectoria prevista de la pelota.
- Se coordinan para cubrir la pista sin ocupar exactamente el mismo espacio.
- Alternan golpes agresivos y de control según su personalidad y dificultad.
- Cometen errores de colocación y ejecución de forma proporcional a su nivel.

## Secuencia de un punto

1. El servidor realiza un saque diagonal.
2. El equipo receptor deja botar y devuelve.
3. El equipo que sacó deja botar también la devolución.
4. Se desarrolla el intercambio: drive, dink, globo, voleas y golpes tras bote.
5. El punto termina por golpe ganador, doble bote, pelota fuera, red o falta de kitchen.
6. Se actualiza el marcador y la rotación del servicio.

## Estado de implementación

La primera versión del motor de partido ya incorpora una pista vertical, marcador tradicional básico, pelota con altura y bote, compañero y rivales controlados por IA, joystick táctil, selección de golpe, gesto de dirección y botón de saque.

Todavía es un prototipo: falta completar y validar la rotación exacta de servidores y posiciones, el saque legal con todas sus condiciones, la física y colisiones de la pelota, las faltas de red y líneas, la IA táctica y la modalidad individual. No debe presentarse todavía como simulación reglamentaria completa.
