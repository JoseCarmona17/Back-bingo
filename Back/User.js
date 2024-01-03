// Importar la biblioteca bcrypt para el hash de contraseñas
const bcrypt = require('bcrypt');

// Definir la clase User
class User {
  // Constructor de la clase User que toma un nombre de usuario y una contraseña
  constructor(username, password) {
    // Inicializar el objeto User con el nombre de usuario y la contraseña proporcionados
    this.setUsername(username);
    this.setPassword(password);
  }

  // Método para establecer el nombre de usuario
  setUsername(username) {
    // Asignar el nombre de usuario al atributo 'username' de la instancia actual
    this.username = username;
  }

  // Método para establecer y hashear la contraseña
  setPassword(password) {
    // Generar un hash sincrónico de la contraseña con un costo de 10 (parámetro recomendado)
    const hashedPassword = bcrypt.hashSync(password, 10);
    // Asignar el hash de la contraseña al atributo 'password' de la instancia actual
    this.password = hashedPassword;
  }

  // Método para validar una contraseña proporcionada con la contraseña almacenada en el objeto User
  validatePassword(password) {
    // Comparar de manera segura la contraseña proporcionada con el hash almacenado
    return bcrypt.compareSync(password, this.password);
  }

  // Método para devolver un objeto que representa al usuario (sin incluir la contraseña)
  toObject() {
    return {
      // Incluir el nombre de usuario en el objeto devuelto
      username: this.username,
      // Omitir la contraseña al devolver el objeto del usuario (por razones de seguridad)
    };
  }
}

// Exportar la clase User para su uso en otros módulos
module.exports = User;
