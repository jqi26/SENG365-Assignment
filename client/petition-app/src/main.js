import Vue from 'vue'
import axios from 'axios'
import VueAxios from "vue-axios";
Vue.use(VueAxios, axios);

import App from './App.vue'
import Home from './Home.vue'
import Petitions from './Petitions.vue'
import Petition from "./Petition";
import Register from "./Register";
import Login from "./Login";
import Profile from "./Profile";

import VueRouter from 'vue-router'
Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home
  },
  {
    path: "/petitions",
    name: "petitions",
    component: Petitions
  },
  {
    path: "/petitions/:id",
    name: "petition",
    component: Petition
  },
  {
    path: "/register",
    name: "Register",
    component: Register
  },
  {
    path: "/login",
    name: "Login",
    component: Login
  },
  {
    path: "/profiles/:id",
    name: "Profile",
    component: Profile
  }
];

const router = new VueRouter({
  routes: routes,
  mode: 'history'
});

new Vue({
  el: '#app',
  router: router,
  render: h => h(App)
});
