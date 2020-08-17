<template>
  <div>
    <nav>
      <router-link class="navLink left" to="/">Home</router-link>
      <router-link class="navLink left" to="/petitions">Petitions</router-link>
      <a class="navLink right" v-on:click="logout()">Logout</a>
      <a class="navLink right" v-on:click="login()">Login</a>
      <a v-if="loggedIn" class="navLink right" v-on:click="profile()">My Profile</a>
    </nav>
  </div>
</template>

<script>
    export default {
      data() {
        return {
          error: "",
          errorFlag: false,
          loggedIn: false
        }
      },
      mounted: function () {
        this.loggedIn = sessionStorage.getItem("token") !== null;
      },
      methods: {
        logout: function () {
          if (sessionStorage.getItem("token") !== null) {
            this.$http.post('http://localhost:4941/api/v1/users/logout', {}, {
              headers: {'X-Authorization': sessionStorage.token}
            })
              .then((response) => {
                sessionStorage.removeItem("id");
                sessionStorage.removeItem("token");
                alert("Log out successful");
                this.$router.push("/");
                location.reload();
              })
              .catch((error) => {
                this.error = error;
                this.errorFlag = true;
              })
          } else {
            alert("You are already logged out")
          }
        },

        login: function() {
          if (sessionStorage.getItem("token") === null) {
            this.$router.push("/login");
          } else {
            alert("You are already logged in")
          }
        },

        profile: function() {
          if (sessionStorage.getItem('token') !== null) {
            this.$router.push("/profiles/" + sessionStorage.getItem('id'));
          } else {
            alert("Must be logged in the view your profile")
          }
        }
      }
    }
</script>

<style scoped>

</style>
