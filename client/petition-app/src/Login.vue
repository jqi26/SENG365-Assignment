<template>
  <div class="registerDiv">
    <h1>Login</h1>

    <form v-on:submit.prevent="login">
      <label for="email">Email*: </label><br>
      <input id="email" class="registerInput" type="email" v-model="email" required>
      <br>
      <label for="password">Password*: </label><br>
      <input id="password" class="registerInput" type="password" v-model="password" required>
      <br><br>
      <button class="mainButton" type="submit">Done</button>
    </form>

    <div v-if="errorFlag" style="color: red;">
      {{ error }}
    </div>
  </div>
</template>

<script>
    export default {
      data() {
        return {
          email: "",
          password: "",
          error: "",
          errorFlag: false,
        }
      },
      mounted: function () {
      },
      methods: {
        login: function () {
          let json = {};
          json["email"] = this.email;
          json["password"] = this.password;

          this.$http.post('http://localhost:4941/api/v1/users/login', JSON.stringify(json), {
            headers: {'Content-Type': 'application/json'}
          })
            .then((response) => {
              sessionStorage.id = response.data.userId;
              sessionStorage.token = response.data.token;
              this.$router.push("/");
              location.reload();
            })
            .catch((error) => {
              this.error = "Incorrect Email or Password";
              this.errorFlag = true;
            })
        }
      }
    }
</script>

<style scoped>
  @import './styles.css';
</style>
