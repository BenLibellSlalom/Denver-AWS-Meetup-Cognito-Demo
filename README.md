# Denver AWS Meet-up Cognito Demo

Code for the demo site shown at the Denver AWS Meet-up on 8/23/2018
Updated 11/5/2020

## Using the Code:
* Download the source:
  * git@github.com:BenLibellSlalom/Denver-AWS-Meetup-Cognito-Demo.git
* Set up a userpool in AWS cognito and get the user pool id and app client id from the cosnole
* Set appropriate Env Variables 
* Naivgate to project folder in the terminal and run the following: 
  * npm install
  * npm start
* in a browser window naviagte to:
  * http://localhost:8080/

### Required Environemnt Variables
**USER_POOL_ID**
* The User-Pool Id to the pool you've set up in AWS to go with this project

**USER_POOL_CLIENT**
* The Client Id of the app client you set up in AWS for your User-Pool
