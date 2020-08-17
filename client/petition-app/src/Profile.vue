<template>
  <div class="mainSectionDiv">
    <div>
      <h2>Your Profile</h2>
      <img v-if="pictureFlag" class="profileImage" alt="<No Photo>" v-bind:src="'http://localhost:4941/api/v1/users/' + this.$route.params.id + '/photo'">
      <img v-else class="profileImage" alt="<No Photo>" src="./assets/profile_placeholder.png">
      <label>Name:</label>
      <p class="petition_p">{{ user.name }}</p>
      <label>Email:</label>
      <p class="petition_p">{{ user.email }}</p>
      <label>City:</label>
      <p class="petition_p">{{ user.city }}</p>
      <label>Country:</label>
      <p class="petition_p">{{ user.country }}</p>

      <button type="button" data-toggle="modal" data-target="#editProfileModal">
        Edit Details
      </button>
      <button type="button" data-toggle="modal" data-target="#editPasswordModal">
        Edit Password
      </button>
      <br><br>
      <label for="selectPictureButton">Your picture:</label><br>
      <input id="selectPictureButton" type="file" accept="image/png,image/gif,image/jpeg" @change="editPicture($event)">
      <button type="button" v-on:click="deletePicture()">
        Delete
      </button>
    </div>

    <hr>

    <div id="users">
      <h3>Your Petitions</h3>
      <div class="petition_div" v-for="petition in userPetitions">
        <table id="petitionTable">
          <tr>
            <td rowspan="3" width="105px">
              <img id="petitionImagePreview" alt="<No Photo>" v-bind:src="'http://localhost:4941/api/v1/petitions/' + petition.petitionId + '/photo'">
            </td>
            <td><a v-on:click="goToPetition(petition.petitionId)">{{ petition.title }}</a></td>
            <td style="text-align: right"><strong>{{ petition.category }}</strong></td>
          </tr>
          <tr>
            <td>Created By {{ petition.authorName }}</td>
          </tr>
          <tr>
            <td>Signatures: {{ petition.signatureCount }}</td>
          </tr>
        </table>
      </div>
    </div>


    <div class="modal fade" id="editProfileModal" tabindex="-1" role="dialog" aria-labelledby="editProfileModalLabel"
         aria-hidden="true">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="editProfileModalLabel">Edit Your Details</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close" v-on:click="resetMessages()">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          <div class="modal-body">
            <form id="newPetition">
              <label for="name">Name*: </label><br>
              <input id="name" class="registerInput" type="text" v-model="newName" required>
              <br>
              <label for="email">Email*: </label><br>
              <input id="email" class="registerInput" type="email" v-model="newEmail" required>
              <br>
              <label for="city">City: </label><br>
              <input id="city" class="registerInput" type="text" v-model="newCity">
              <br>
              <label for="country">Country: </label><br>
              <input id="country" class="registerInput" type="text" v-model="newCountry">
            </form>

            <div v-if="errorFlag" style="color: red;">
              {{ error }}
            </div>
            <div v-if="successFlag" style="color: green;">
              Successfully Updated!
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal" v-on:click="resetMessages()">
              Close
            </button>
            <button type="button" class="btn btn-primary" v-on:click="updateBasicDetails({ 'name': newName,
            'email': newEmail, 'city': newCity, 'country': newCountry })">
              Update
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="editPasswordModal" tabindex="-1" role="dialog" aria-labelledby="editPasswordModalLabel"
         aria-hidden="true">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="editPasswordModalLabel">Edit Your Password</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close" v-on:click="resetMessages()">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          <div class="modal-body">
            <form id="newPasswordForm">
              <label for="newPassword">New Password: </label><br>
              <input id="newPassword" class="registerInput" type="password" v-model="newPassword" required>
              <br>
              <label for="repeatPassword">Repeat Password: </label><br>
              <input id="repeatPassword" class="registerInput" type="password" v-model="repeatPassword" required>
              <br>
              <label for="confirmPassword">Confirm Old Password: </label><br>
              <input id="confirmPassword" class="registerInput" type="password" v-model="currentPassword" required>
            </form>

            <div v-if="errorFlag" style="color: red;">
              {{ error }}
            </div>
            <div v-if="successFlag" style="color: green;">
              Successfully Updated!
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal" v-on:click="resetMessages()">
              Close
            </button>
            <button type="button" class="btn btn-primary" v-on:click="updatePassword({ 'password': newPassword,
             'currentPassword': currentPassword })">
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
    export default {
      data() {
        return {
          error: "",
          errorFlag: false,
          successFlag: false,
          user: null,
          currentPassword: "",
          newName: "",
          newEmail: "",
          newCity: "",
          newCountry: "",
          newPassword: "",
          repeatPassword: "",
          pictureFlag: false,
          userPetitions: [],
          categories: []
        }
      },
      mounted: function () {
        this.getUser();
        this.pictureExists();
        this.getPetitions();
        this.getCategories();
      },
      methods: {
        getUser: function () {
          this.$http.get('http://localhost:4941/api/v1/users/' + this.$route.params.id, {
            headers: { 'X-Authorization': sessionStorage.token }
          })
            .then((response) => {
              this.user = response.data;
              this.newName = response.data.name;
              this.newEmail = response.data.email;
              this.newCity = response.data.city;
              this.newCountry = response.data.country;
            })
            .catch((error) => {
              this.error = error;
              this.errorFlag = true;
              this.successFlag = false;
            })
        },

        updateBasicDetails: function(json) {
          this.successFlag = false;
          this.errorFlag = true;
          if (this.user.city === null && (this.newCity === "" || this.newCity === null)) {
            delete json["city"];
          }
          if (this.user.country === null && (this.newCountry === "" || this.newCountry === null)) {
            delete json["country"];
          }

          if (this.newName === "") {
            this.error = "Name cannot be empty";
          } else if (this.newEmail === "") {
            this.error = "Email cannot be empty";
          } else {
            this.errorFlag = false;
            this.updateUser(json);
          }
        },

        updatePassword: function(json) {
          this.successFlag = false;
          this.errorFlag = true;
          if (this.newPassword === "") {
            this.error = "New password cannot be empty";
          } else if (this.repeatPassword === "") {
            this.error = "Repeat password cannot be empty";
          } else if (this.currentPassword === "") {
            this.error = "Current password cannot be empty";
          } else if (this.newPassword !== this.repeatPassword) {
            this.error = "Current and repeat passwords do not match";
          } else {
            this.errorFlag = false;
            this.updateUser(json);
          }
        },

        updateUser: function(json) {
          this.$http.patch('http://localhost:4941/api/v1/users/' + this.$route.params.id, JSON.stringify(json), {
            headers: {'Content-Type': 'application/json', 'X-Authorization': sessionStorage.token}
          })
            .then((response) => {
              this.getUser();
              this.errorFlag = false;
              this.successFlag = true;
              this.currentPassword = "";
            })
            .catch((error) => {
              let message = error.response.statusText;
              this.error = message.charAt(message.indexOf(":") + 2).toUpperCase() + message.substring(message.indexOf(":") + 3);
              this.errorFlag = true;
              this.successFlag = false;
            })
        },

        editPicture: function(event) {
          let picture = event.target.files[0];
          let filename = document.getElementById("selectPictureButton").value;
          let contentType = 'image/' + filename.split('.').pop();
          if (contentType === "image/jpg") {
            contentType = "image/jpeg";
          }
          this.$http.put('http://localhost:4941/api/v1/users/' + sessionStorage.id + '/photo', picture, {
            emulateJSON: false,
            headers: { 'Content-Type': contentType, 'X-Authorization': sessionStorage.token}
          })
            .then((response) => {
              location.reload();
            })
            .catch((error) => {
              this.error = error;
              this.errorFlag = true;
              this.successFlag = false;
            })
        },

        deletePicture: function() {
          this.$http.delete('http://localhost:4941/api/v1/users/' + sessionStorage.id + '/photo', {
            headers: { 'X-Authorization': sessionStorage.token}
          })
            .then((response) => {
              this.pictureFlag = false;
            })
            .catch((error) => {
              this.error = error;
              this.errorFlag = true;
              this.successFlag = false;
            })
        },

        pictureExists: function() {
          this.$http.get('http://localhost:4941/api/v1/users/' + sessionStorage.id + '/photo', {
            headers: { 'X-Authorization': sessionStorage.token}
          })
            .then((response) => {
              this.pictureFlag = true;
            })
            .catch((error) => {
            })
        },

        getPetitions: function () {
          let headersToAdd = { "authorId": this.$route.params.id };
          this.$http.get('http://localhost:4941/api/v1/petitions', {
            params: headersToAdd
          })
            .then((response) => {
              this.userPetitions = response.data;
            })
            .catch((error) => {
              this.error = error;
              this.errorFlag = true;
              this.successFlag = false;
            })
        },

        getCategories: function() {
          this.$http.get('http://localhost:4941/api/v1/petitions/categories')
            .then((response) => {
              this.categories = response.data;
            })
            .catch((error) => {
              this.error = error;
              this.errorFlag = true;
              this.successFlag = false;
            })
        },

        goToPetition: function(petitionId) {
          this.$router.push("/petitions/" + petitionId);
        },

        resetMessages: function() {
          this.errorFlag = false;
          this.successFlag = false;
          this.error = "";
        }
      }
    }
</script>

<style scoped>
  @import './styles.css';
</style>
