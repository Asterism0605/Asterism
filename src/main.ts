import { createApp } from 'vue'
import './styles/main.css'
import App from './App.vue'
import Login from './pages/Login.vue'
import SignUp from './pages/SignUp.vue'

const path = window.location.pathname
const component = path === '/login' ? Login : path === '/signup' ? SignUp : App

createApp(component).mount('#app')
