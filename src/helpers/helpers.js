function convertirAMayuscula(nombre) {
  if (!nombre) return ""; // Si es vacío
  return nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase();
}
function convertirAMinuscula(texto) {
  if (!texto) return "";
  return texto.toLowerCase();
}
function generarNombreUsuario(nombre, ci){
    return usuario = nombre+"."+ci;

}
module.exports = {
  convertirAMayuscula,
  convertirAMinuscula,
  generarNombreUsuario
};