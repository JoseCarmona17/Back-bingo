// Importar las bibliotecas necesarias
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();  // Cargar variables de entorno desde un archivo .env

// Configurar la aplicación Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',  // Permitir solicitudes desde cualquier origen (CORS)
  },
});

// Configurar middleware para el manejo de datos en formato JSON y CORS
app.use(express.json());
app.use(cors());

// Conectar a la base de datos MongoDB
mongoose.connect('mongodb://localhost:27017/usuarios', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Definir un esquema para la colección de usuarios en MongoDB
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

// Crear un modelo de usuario basado en el esquema
const User = mongoose.model('User', userSchema);

// Arreglos para almacenar la lista de usuarios y las balotas del juego
const userList = [];
let balotas = [];

// Endpoint para la autenticación de usuarios (login)
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Nombre de usuario o contraseña faltante' });
    }

    const user = await User.findOne({ username });

    if (user) {
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        // Generar un token de autenticación con el ID del usuario
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        // Crear una sala de juego para el usuario
        crearSala(username);
        res.json({ token });
      } else {
        res.status(401).json({ error: 'Credenciales incorrectas' });
      }
    } else {
      res.status(401).json({ error: 'Credenciales incorrectas' });
    }
  } catch (error) {
    console.error('Error al buscar el usuario en la base de datos:', error.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Endpoint para el registro de nuevos usuarios
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Nombre de usuario o contraseña faltante' });
    }

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      res.status(400).json({ error: 'El usuario ya existe' });
    } else {
      // Hashear la contraseña antes de almacenarla en la base de datos
      const hashedPassword = await bcrypt.hash(password, 10);
      // Crear un nuevo usuario con el nombre de usuario y la contraseña hasheada
      const newUser = new User({ username, password: hashedPassword });
      // Guardar el nuevo usuario en la base de datos
      await newUser.save();
      res.json({ message: 'Usuario registrado exitosamente' });
    }
  } catch (error) {
    console.error('Error al registrar el usuario en la base de datos:', error.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Función para crear una sala de juego para un usuario
function crearSala(username) {
  console.log("Entro a la funcion crear sala " + username);
  // Agregar el usuario a la lista de usuarios
  userList.push(username);

  // Emitir la lista de usuarios a todos los clientes conectados
  io.emit('userList', Object.values(userList));
  io.emit('balotas', balotas);

  // Manejar eventos de conexión y desconexión para la sala de juego
  io.on('connection', (socket) => {
    console.log("log");
    // Emitir la lista de usuarios a todos los clientes
    io.emit('userList', Object.values(userList));

    // Emitir la lista de balotas al nuevo usuario
    socket.emit('balotas', balotas);

    // Manejar el evento 'startGame' para redirigir a los usuarios al inicio del juego
    socket.on('startGame', () => {
      io.emit('redirectToHome');
    });

    // Manejar el evento 'disconnect' para actualizar la lista de usuarios al desconectar
    socket.on('disconnect', () => {
      console.log("dis");
      // Actualizar la lista de usuarios y emitirla a todos los clientes
      io.emit('userList', Object.values(userList));
    });
  });
}

// Evento para manejar la generación de nuevas balotas cada 5 segundos
setInterval(() => {
  const letras = ['B', 'I', 'N', 'G', 'O'];
  let letraAleatoria, numeroAleatorio;

  do {
    letraAleatoria = letras[Math.floor(Math.random() * letras.length)];
    numeroAleatorio = generarNumeroAleatorio();
  } while (balotas.includes(`${letraAleatoria}${numeroAleatorio}`));

  const nuevaBalota = `${letraAleatoria}${numeroAleatorio}`;

  balotas.push(nuevaBalota);

  // Emitir la nueva balota a todos los clientes
  io.emit('nuevaBalota', nuevaBalota);
  io.emit('balotas', balotas);

}, 5000);

// Función para generar un número aleatorio entre 1 y 75
const generarNumeroAleatorio = () => {
  return Math.floor(Math.random() * 75) + 1;
};

// Configurar el puerto del servidor, utilizando el puerto definido en las variables de entorno o el puerto 5000 por defecto
const PORT = process.env.PORT || 5000;

// Iniciar el servidor en el puerto especificado
server.listen(PORT, () => {
  console.log(`Servidor backend escuchando en el puerto ${PORT}`);
});
