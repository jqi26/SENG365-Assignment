<template>
  <div class="registerDiv">
    <h1>Register</h1>

    <form v-on:submit.prevent="registerUser">
      <label for="name">Name*: </label><br>
      <input id="name" class="registerInput" type="text" v-model="name" required>
      <br>
      <label for="email">Email*: </label><br>
      <input id="email" class="registerInput" type="email" v-model="email" required>
      <br>
      <label for="password">Password*: </label><br>
      <input id="password" class="registerInput" type="password" v-model="password" required>
      <br>
      <label for="confirmPassword">Confirm Password*: </label><br>
      <input id="confirmPassword" class="registerInput" type="password" v-model="confirmPassword" required>
      <br>
      <label for="city">City: </label><br>
      <input id="city" class="registerInput" type="text" v-model="city">
      <br>
      <label for="country">Country: </label><br>
      <input id="country" class="registerInput" type="text" v-model="country">
      <br>
      <label for="picture">Your picture:</label><br>
      <input id="picture" type="file" accept="image/png,image/gif,image/jpeg" @change="processFile($event)">
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
          error: "",
          errorFlag: false,
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          city: "",
          country: "",
          picture: null,
          filename: "",
          id: -1,
        }
      },
      mounted: function () {
      },
      methods: {
        registerUser: function () {
          if (this.password !== this.confirmPassword) {
            this.error = "Passwords do not match";
            this.errorFlag = true;
          } else {
            let json = {};
            json["name"] = this.name;
            json["email"] = this.email;
            json["password"] = this.password;
            if (this.city !== "") {
              json["city"] = this.city;
            }
            if (this.country !== "") {
              json["country"] = this.country;
            }

            this.$http.post('http://localhost:4941/api/v1/users/register', JSON.stringify(json), {
              headers: {'Content-Type': 'application/json'}
            })
              .then((response) => {
                this.id = response.data.userId;
                this.error = "";
                this.errorFlag = false;
                this.login();
              })
              .catch((error) => {
                let message = error.response.statusText;
                this.error = message.charAt(message.indexOf(":") + 2).toUpperCase() + message.substring(message.indexOf(":") + 3);
                this.errorFlag = true;
              })
          }
        },

        addPicture: function() {
          let contentType = 'image/' + this.filename.split('.').pop();
          if (contentType === "image/jpg") {
            contentType = "image/jpeg";
          }
          this.$http.put('http://localhost:4941/api/v1/users/' + this.id + '/photo', this.picture, {
            emulateJSON: false,
            headers: { 'Content-Type': contentType, 'X-Authorization': sessionStorage.token}
          })
            .then((response) => {
              this.$router.push("/petitions");
              location.reload();
            })
            .catch((error) => {
              this.error = error;
              this.errorFlag = true;
            })
        },

        processFile: function(event) {
          this.picture = event.target.files[0];
          this.filename = document.getElementById("picture").value;
        },

        login: function() {
          this.$http.post('http://localhost:4941/api/v1/users/login', JSON.stringify({
            "email": this.email,
            "password": this.password
            }
          ), {
            headers: { 'Content-Type': 'application/json'}})
            .then((response) => {
              sessionStorage.id = response.data.userId;
              sessionStorage.token = response.data.token;
              if (this.filename !== "") {
                this.addPicture();
              } else {
                this.$router.push("/petitions");
                location.reload();
              }
            })
            .catch((error) => {
              this.error = error;
              this.errorFlag = true;
            })
        }
      }
    }
</script>

<style scoped>
  @import './styles.css';
</style>
