<template>
  <div class="mainSectionDiv">
    <div class="headerDiv">
      <h1 id="petitionHeader">Petitions</h1>
    </div>

    <div class="addActivityDiv">
      <button v-if="token !== null" type="button" class="mainButton addPetitionButton" data-toggle="modal" data-target="#addPetitionModal">
        Add
      </button>
    </div>
    <div style="clear:both;"></div>
    <div id="filterDiv">
      <input style="width: 180px" v-model="searchTerm" placeholder="Something..."/>
      <select id="category_select" v-model="categoryFilter">
        <option value=-1 selected>Any Category</option>
        <option v-for="category in categories" v-bind:value="category.categoryId">
          {{ category.name }}
        </option>
      </select>

      <select id="sort_select" v-model="sortBy">
        <option value="ALPHABETICAL_ASC">Alphabetically by title, A-Z</option>
        <option value="ALPHABETICAL_DESC">Alphabetically by title, Z-A</option>
        <option value="SIGNATURES_ASC">Number of signatures, least to most</option>
        <option value="SIGNATURES_DESC" selected>Number of signatures, most to least</option>
      </select>
      <button type="button" class="btn btn-primary" v-on:click="getPetitions(true, false)">
        Search
      </button>
    </div>
    <br><br>

    <div id="users">
      <div class="petition_div" v-for="petition in petitions">
        <table id="petitionTable">
          <tr>
            <td rowspan="3" width="105px">
              <img id="petitionImagePreview" alt="<No Photo>" v-bind:src="'http://localhost:4941/api/v1/petitions/' + petition.petitionId + '/photo'">
            </td>
            <td><router-link :to="{ path: petition.petitionId.toString()}" append>{{ petition.title }}</router-link></td>
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

    <div id="endReachedDiv" v-if="petitions.length < 10 || startIndex + 10 === petitionCount"><b>End Reached</b></div>

    <div id="paginationDiv">
      <button class="left" v-on:click="changePage(0)" :disabled="startIndex === 0">First</button>
      <button class="left" v-on:click="changePage(startIndex - 10)" :disabled="startIndex === 0"><</button>
      <b id="pageNumber">{{ Math.floor(startIndex / 10) + 1 }}</b>
      <button class="right" v-on:click="changePage(Math.floor(petitionCount / 10) * 10)" :disabled="petitions.length < 10 || startIndex + 10 === petitionCount">Last</button>
      <button class="right" v-on:click="changePage(startIndex + 10)" :disabled="petitions.length < 10 || startIndex + 10 === petitionCount">></button>
    </div>

    <div class="modal fade" id="addPetitionModal" tabindex="-1" role="dialog" aria-labelledby="addPetitionModalLabel"
         aria-hidden="true">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="addPetitionModalLabel">Add a Petition</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          <div class="modal-body">
            <form id="newPetition">
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
              <br>
              <label for="picture">Picture*:</label><br>
              <input id="picture"  type="file" accept="image/png,image/gif,image/jpeg" @change="processFile($event)">
            </form>

            <div v-if="errorFlag" style="color: red;">
              {{ error }}
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal">
              Close
            </button>
            <button type="button" class="btn btn-primary" v-on:click="createPetition()">
              Create
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
          petitions: [],
          searchTerm: "",
          categories: [],
          categoryFilter: -1,
          sortBy: "",
          newTitle: "",
          newDescription: "",
          newCategory: -1,
          newCloseDate: "",
          newCloseTime: "",
          newPicture: null,
          newFilename: "",
          token: null,
          startIndex: 0,
          petitionCount: -1
        }
      },
      mounted: function () {
        this.getPetitions(true, false);
        this.getCategories();
        this.token = sessionStorage.getItem('token');
      },
      methods: {
        getPetitions: function (isInitialSearch, isChangingPage) {
          if (isInitialSearch) {
            this.getNumberOfPetitions();
          }

          if (!isChangingPage) {
            this.startIndex = 0;
          }

          let headersToAdd = {};
          if (this.searchTerm !== "") {
              headersToAdd['q'] = this.searchTerm;
          }
          if (Number(this.categoryFilter) !== -1) {
            headersToAdd['categoryId'] = this.categoryFilter;
          }
          if (this.sortBy !== "") {
            headersToAdd['sortBy'] = this.sortBy;
          }
          headersToAdd['startIndex'] = this.startIndex;
          headersToAdd['count'] = 10;

          this.$http.get('http://localhost:4941/api/v1/petitions', {
            params: headersToAdd
          })
            .then((response) => {
              this.petitions = response.data;
            })
            .catch((error) => {
              this.error = error;
              this.errorFlag = true;
            })
        },

        getNumberOfPetitions: function() {
          let headersToAdd = {};
          if (this.searchTerm !== "") {
            headersToAdd['q'] = this.searchTerm;
          }
          if (Number(this.categoryFilter) !== -1) {
            headersToAdd['categoryId'] = this.categoryFilter;
          }
          if (this.sortBy !== "") {
            headersToAdd['sortBy'] = this.sortBy;
          }

          this.$http.get('http://localhost:4941/api/v1/petitions', {
            params: headersToAdd
          })
            .then((response) => {
              this.petitionCount = response.data.length;
              console.log(this.petitionCount);
            })
            .catch((error) => {
              this.error = error;
              this.errorFlag = true;
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
            })
        },

        processFile: function(event) {
          this.newPicture = event.target.files[0];
          this.newFilename = document.getElementById("picture").value;
        },

        createPetition: function() {
          this.errorFlag = true;
          if (this.newTitle === "") {
            this.error = "Title cannot be empty";
          } else if (this.newDescription === "") {
            this.error = "Description cannot be empty";
          } else if (this.newCategory === -1) {
            this.error = "Category cannot be empty";
          } else if (this.newFilename === "") {
            this.error = "A picture is required"
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

            this.$http.post('http://localhost:4941/api/v1/petitions', JSON.stringify(json), {
              headers: {'Content-Type': 'application/json', 'X-Authorization': sessionStorage.token}
            })
              .then((response) => {
                this.addSignature(response.data.petitionId);
                this.addPicture(response.data.petitionId);
              })
              .catch((error) => {
                this.error = "Closing Date must be in the future";
                this.errorFlag = true;
              })
          }
        },

        addPicture: function(petitionId) {
          let contentType = 'image/' + this.newFilename.split('.').pop();
          if (contentType === "image/jpg") {
            contentType = "image/jpeg";
          }
          this.$http.put('http://localhost:4941/api/v1/petitions/' + petitionId + '/photo', this.newPicture, {
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

        addSignature: function(petitionId) {
          this.$http.post('http://localhost:4941/api/v1/petitions/' + petitionId + '/signatures', {}, {
            headers: { 'X-Authorization': sessionStorage.token}
          })
            .then((response) => {
            })
            .catch((error) => {
              this.error = error;
              this.errorFlag = true;
            })
        },

        changePage: function (index) {
          if (index === this.petitionCount) {
            index -= 10;
          }
          this.startIndex = index;
          this.getPetitions(false, true);
        }
      }
    }
</script>

<style scoped>
  @import './styles.css';
</style>
