var mongoose=require("mongoose");
var Campground=require("./models/campground");
var Comment=require("./models/comment");

var data=[
        {
            name :"Grand Canyon",
            image:"https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
            description:"This is gr8"
        },
        {
             name :"The Taj",
            image:"https://images.unsplash.com/photo-1523428461295-92770e70d7ae?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
            description:"This is gr8 TAJ"
        },
    ];


function seedDB(){
    Campground.deleteMany({},function(err){
      if(err){
          console.log(err);
      } 
      else{
          console.log("Removed Campground");
                        data.forEach(function(seed){
                            Campground.create(seed,function (err,campground) {
                          if(err){
                              console.log(err);
                          }
                          else{
                                  console.log("added  new campground");
                                  Comment.create(
                                      {
                                      text:"This palce is gr8",
                                      author:"ME"
                                  } ,function(err,comment){
                                      if(err)
                                      {
                                          console.log(err);
                                      }
                                      else
                                      {
                                         campground.comments.push(comment);
                                        campground.save();
                                        console.log("created new comment");
                                      }
                                      
                                  });
                             }
                       
                  });
                });
         }
    });
   
}
module.exports=seedDB;