# Forja Gym

App estatica para controlar rutinas de gimnasio, ejercicios, series, volumen, records, plan semanal, progreso, peso corporal y glucosa.

## Funciones

- Registro de entrenos, series, repeticiones y peso.
- Biblioteca de ejercicios con ejercicios personalizados.
- Fotos por ejercicio, guardadas en el navegador.
- Rutinas semanales editables: pon/quita ejercicios por dia y cargalos como entreno de hoy.
- Compartir rutina semanal y ejercicios.
- Seguimiento de peso y azucar en sangre.
- Exportacion JSON/CSV para copia de seguridad o uso con Atajos/Numbers.

## Apple Fitness / Salud

Una PWA no puede sincronizar directamente con Apple Fitness o Salud porque Apple reserva HealthKit para apps nativas. La app exporta CSV para que puedas mover datos mediante Atajos, Numbers o una futura app nativa.

## Ejecutar local

Abre `index.html` directamente o sirve la carpeta con cualquier servidor estatico.

## Publicar en GitHub Pages

1. Sube estos archivos a un repositorio de GitHub.
2. Entra en `Settings > Pages`.
3. En `Build and deployment`, selecciona `Deploy from a branch`.
4. Elige la rama `main` y la carpeta `/root`.
5. Guarda. GitHub publicara la URL de la app.

La app funciona como PWA y guarda los datos en el navegador del dispositivo.
