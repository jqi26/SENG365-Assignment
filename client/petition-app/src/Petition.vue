<template>
  <div>
    <!-- I got these buttons from simplesharebuttons.com -->
    <div id="share-buttons">
      <!-- Email -->
      <a :href="'mailto:?Subject=Check out this Petition&amp;Body=This%20seems%20cool!%20 http://localhost:8080/petitions/'
                + this.$route.params.id" id="emailButton">
        <img src="https://simplesharebuttons.com/images/somacro/email.png" alt="Email" />
      </a>

      <!-- Facebook -->
      <a :href="'http://www.facebook.com/sharer.php?u=https://canterbury.ac.nz/petitions/'
                + this.$route.params.id" target="_blank">
        <img src="https://simplesharebuttons.com/images/somacro/facebook.png" alt="Facebook" />
      </a>

      <!-- Reddit -->
      <a :href="'http://reddit.com/submit?url=http://localhost:8080/petitions/' + this.$route.params.id
                + '&amp;title=Check out this petition'" target="_blank">
        <img src="https://simplesharebuttons.com/images/somacro/reddit.png" alt="Reddit" />
      </a>

      <!-- Twitter -->
      <a :href="'https://twitter.com/share?url=http://localhost:8080/petitions/' + this.$route.params.id
                + '&amp;text=Check%20out%20this%20petition&amp;hashtags=coolpetition'" target="_blank">
        <img src="https://simplesharebuttons.com/images/somacro/twitter.png" alt="Twitter" />
      </a>
    </div>

    <div id="petitionManage" v-if="userId !== null && userId === petition.authorId.toString()">
      <h3 style="text-align: center">Manage</h3>
      <button v-if="!closed" type="button" class="mainButton editPetitionButton" data-toggle="modal" data-target="#editPetitionModal">
        Edit
      </button>
      <br>
      <input v-if="!closed" type="file" id="selectedFile" style="display: none;" accept="image/png,image/gif,image/jpeg" @change="editPicture($event)" />
      <input v-if="!closed" type="button" class="mainButton editPetitionButton" value="Edit Picture" onclick="document.getElementById('selectedFile').click();" />
      <br>
      <button type="button" class="mainButton editPetitionButton" v-on:click="deletePetition()">
        Delete
      </button>
    </div>

    <div class="mainSectionDiv">
      <div>
        <h2>{{ petition.title }}</h2>
        <img id="petitionImage" alt="<No Photo>" v-bind:src="'http://localhost:4941/api/v1/petitions/' + this.$route.params.id + '/photo'">
        <br>
        <label>Description:</label>
        <p class="petition_p">{{ petition.description }}</p>
        {{ getPhoto(petition.authorId, "authorImage") }}
        <img id="authorImage" class="petitionAuthorImage" alt="<No Photo>" src="./assets/profile_placeholder.png">
        <br>
        <label>Author Name:</label>
        <p class="petition_p">{{ petition.authorName }}</p>
        <label>Author City:</label>
        <p v-if="petition.authorCity !== 'null'" class="petition_p">{{ petition.authorCity }}</p>
        <p v-else></p>
        <label>Author Country:</label>
        <p v-if="petition.authorCountry !== 'null'" class="petition_p">{{ petition.authorCountry }}</p>
        <p v-else></p>
        <label>Number of signatures:</label>
        <p class="petition_p">{{ petition.signatureCount }}</p>
        <label>Category:</label>
        <p class="petition_p">{{ petition.category }}</p>
        <label>Created Date:</label>
        <p class="petition_p">{{ petition.createdDate }}</p>
        <label>Closing Date:</label>
        <p v-if="petition.closingDate !== null" class="petition_p">
          {{ petition.closingDate }}
        </p>
        <p v-else>None</p>
        <button v-if="userId !== null && userId !== petition.authorId.toString() && signed && !closed" class="mainButton"
                v-on:click = "deleteSignature()">Unsign</button>
        <button v-if="userId !== null && userId !== petition.authorId.toString() && !signed && !closed" class="mainButton"
        v-on:click="addSignature()">Sign</button>
      </div>

      <hr>

      <div>
        <h3>Signees</h3>
        <div class="signatureDiv" v-for="signature in signatures">
          {{ getPhoto(signature.signatoryId, 'signatureImage' + signature.signatoryId) }}
          <img :id="'signatureImage' + signature.signatoryId" src="./assets/profile_placeholder.png" alt="<No Photo>" width="50" height="50" >
          <p class="petition_p"><strong>{{ signature.name }}</strong></p>
          <p class="petition_p">{{ signature.country }}</p>
          <p class="petition_p">{{ signature.city }}</p>
        </div>
      </div>
    </div>

    <div class="modal fade" id="editPetitionModal" tabindex="-1" role="dialog" aria-labelledby="editPetitionModalLabel"
         aria-hidden="true">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="editPetitionModalLabel">Modify this Petition</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          <div class="modal-body">
            <form id="editPetition">
              <label for="title">Title*:</label><br>
              <input type="text" id="title" class="registerInput" v-model="newTitle" required>
              <br>
              <label for="description">Description*:</label><br>
              <textarea id="description" class="registerInput" v-model="newDescription" required></textarea>
              <br>
              <label for="category">Category*:</label><br>
              <select id="category" class="registerInput" v-model="newCategory" required>
                <option v-for="category in categories" v-bind:value="category.categoryId">
                  {{ category.name }}
                </option>
              </select>
              <br>
              <label for="closeDate">Closing Date:</label><br>
              <input type="date" class="registerInput" id="closeDate" v-model="newCloseDate">
              <br>
              <label for="closeTime" v-if="newCloseDate !== ''">Closing Time:</label><br>
              <input type="time" class="registerInput" id="closeTime" v-if="newCloseDate !== ''" v-model="newCloseTime">
            </form>

            <div v-if="errorFlag" style="color: red;">
              {{ error }}
            </div>
            <div v-if="successFlag" style="color: green;">
              Successfully Updated!
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal">
              Close
            </button>
            <button type="button" class="btn btn-primary" v-on:click="editPetition()">
              Confirm
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
          petition: null,
          signatures: [],
          userId: "",
          signed: false,
          closed: false,
          newTitle: "",
          newDescription: "",
          newCategory: -1,
          newCloseDate: "",
          newCloseTime: "",
          newPicture: null,
          newFilename: "",
          categories: [],
          emailLink: "",
          facebookLink: "",
          twitterLink: "",
          redditLink: "",
          successFlag: false
        }
      },
      mounted: function () {
        this.getPetition();
        this.getSignatures();
        this.getCategories();
        this.userId = sessionStorage.getItem('id');
      },
      methods: {
        getPetition: function () {
          this.$http.get('http://localhost:4941/api/v1/petitions/' + this.$route.params.id)
            .then((response) => {
              this.petition = response.data;
              this.petition.createdDate = new Date(this.petition.createdDate);
              this.newTitle = this.petition.title;
              this.newDescription = this.petition.description;
              if (this.petition.closingDate !== null) {
                this.petition.closingDate = new Date(this.petition.closingDate);
                this.newCloseDate = this.formatDate(this.petition.closingDate);
                this.newCloseTime = this.formatTime(this.petition.closingDate);
              }
              this.hasClosed();
            })
            .catch((error) => {
              this.error = error;
              this.errorFlag = true;
            })
        },

        formatDate: function(dateObject) {
          let day = dateObject.getDate();
          let month = dateObject.getMonth() + 1;
          let year = dateObject.getFullYear();

          if (day < 10) {
            day = '0' + day;
          }
          if (month < 10) {
            month = '0' + month;
          }

          return year + '-' + month + '-' + day;
        },

        formatTime: function(dateObject) {
          let minutes = dateObject.getMinutes();
          let hours = dateObject.getHours();

          if (minutes < 10) {
            minutes = '0' + minutes;
          }
          if (hours < 10) {
            hours = '0' + hours;
          }

          return hours + ':' + minutes;
        },

        getSignatures: function () {
          this.$http.get('http://localhost:4941/api/v1/petitions/' + this.$route.params.id + '/signatures')
            .then((response) => {
              this.signatures = response.data;
              this.signed = this.userHasSigned();
            })
            .catch((error) => {
              this.error = error;
              this.errorFlag = true;
            })
        },

        addSignature: function () {
          this.$http.post('http://localhost:4941/api/v1/petitions/' + this.$route.params.id + '/signatures', {}, {
            headers: {'X-Authorization': sessionStorage.token}
          })
            .then((response) => {
              alert("Successfully signed this petition!");
              this.petition.signatureCount++;
              this.getSignatures();
            })
            .catch((error) => {
              this.error = error;
              this.errorFlag = true;
            })
        },

        deleteSignature: function () {
          this.$http.delete('http://localhost:4941/api/v1/petitions/' + this.$route.params.id + '/signatures', {
            headers: {'X-Authorization': sessionStorage.token}
          })
            .then((response) => {
              alert("Successfully unsigned this petition");
              this.petition.signatureCount--;
              this.getSignatures();
            })
            .catch((error) => {
              this.error = error;
              this.errorFlag = true;
            })
        },

        userHasSigned: function () {
          if (this.userId !== null) {
            for (let i = 0; i < this.signatures.length; i++) {
              if (this.signatures[i].signatoryId.toString() === this.userId.toString()) {
                return true;
              }
            }
          }
          return false;
        },

        hasClosed: function () {
          if (this.petition.closingDate === null) {
            this.closed = false;
          } else {
            let today = new Date();
            this.closed = today >= this.petition.closingDate;
          }
        },

        editPetition: function () {
          this.errorFlag = true;
          this.successFlag = false;
          if (this.newTitle === "") {
            this.error = "Title cannot be empty";
          } else if (this.newDescription === "") {
            this.error = "Description cannot be empty";
          } else if (this.newCategory === -1) {
            this.error = "Category cannot be empty";
          } else {
            this.errorFlag = false;
            let json = {};
            json["title"] = this.newTitle;
            json["description"] = this.newDescription;
            json["categoryId"] = this.newCategory;
            if (this.newCloseDate !== "") {
              if (this.newCloseTime !== "") {
                json["closingDate"] = this.newCloseDate + " " + this.newCloseTime + ":00.000";
              } else {
                json["closingDate"] = this.newCloseDate + " 00:00:00.000";
              }
            }

            this.$http.patch('http://localhost:4941/api/v1/petitions/' + this.$route.params.id, JSON.stringify(json), {
              headers: {'Content-Type': 'application/json', 'X-Authorization': sessionStorage.token}
            })
              .then((response) => {
                this.getPetition();
                this.successFlag = true;
              })
              .catch((error) => {
                console.log(error);
                this.error = "Closing Date must be in the future";
                this.errorFlag = true;
                this.successFlag = false;
              })
          }
        },

        getCategories: function () {
          this.$http.get('http://localhost:4941/api/v1/petitions/categories')
            .then((response) => {
              this.categories = response.data;
              for (let i = 0; i < this.categories.length; i++) {
                if (this.categories[i].name === this.petition.category) {
                  this.newCategory = this.categories[i].categoryId;
                  break;
                }
              }
            })
            .catch((error) => {
              this.error = error;
              this.errorFlag = true;
            })
        },

        deletePetition: function () {
          if (confirm("Are you sure you want to delete this petition?")) {
            this.$http.delete('http://localhost:4941/api/v1/petitions/' + this.$route.params.id, {
              headers: {'X-Authorization': sessionStorage.token}
            })
              .then((response) => {
                this.$router.push("/petitions");
              })
              .catch((error) => {
                this.error = error;
                this.errorFlag = true;
              })
          }
        },

        editPicture: function(event) {
          let picture = event.target.files[0];
          let filename = document.getElementById("selectedFile").value;
          let contentType = 'image/' + filename.split('.').pop();
          if (contentType === "image/jpg") {
            contentType = "image/jpeg";
          }
          this.$http.put('http://localhost:4941/api/v1/petitions/' + this.$route.params.id + '/photo', picture, {
            emulateJSON: false,
            headers: { 'Content-Type': contentType, 'X-Authorization': sessionStorage.token}
          })
            .then((response) => {
              location.reload();
            })
            .catch((error) => {
              this.error = error;
              this.errorFlag = true;
            })
        },

        getPhoto: function(id, elementId) {
          this.$http.get('http://localhost:4941/api/v1/users/' + id + '/photo')
            .then((response) => {
              if (response.status !== 404) {
                document.getElementById(elementId).src = 'http://localhost:4941/api/v1/users/' + id + '/photo';
              }
            })
            .catch((error) => {
            })
        }
      }
    }
</script>

<style scoped>
  @import './styles.css';
</style>
