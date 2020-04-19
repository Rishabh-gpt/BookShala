var express = require("express"),
        app = express(),
 bodyParser = require("body-parser"),
   mongoose = require("mongoose"),
   flash    =require("connect-flash"),
   passport =require("passport"),
   LocalStrategy=require("passport-local"),
  methodOverride=require("method-override"),
   User     = require("./models/user"),
 Campground =require("./models/campground"),
 Comment    =require("./models/comment"),
    seedDB  =require("./seeds");
    // seedDB();
    var middleware=require("./middleware");
    
// mongoose.connect(process.env.DATABASEURL);
mongoose.connect("mongodb+srv://rishabh:rusty@cluster0-rvyxk.mongodb.net/test?retryWrites=true&w=majority",{
	useNewUrlParser: true,
	useCreateIndex: true
}).then(() => {
	console.log('Connected to DB!');
}).catch(err => {
	console.log('ERROR:', err.message);
});
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.use(require("express-session")({
    secret:"Rishabh is best",
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(function(req,res,next){
    res.locals.currentUser=req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});


//====================Routes
app.get("/", function(req, res) {
    res.render("landing");
});
app.get("/campgrounds", function(req, res) {
    Campground.find({},function(err,allCampgrounds){
       if(err)
       console.log(err);
       else
       res.render("campgrounds/index", { campgrounds: allCampgrounds,currentUser:req.user });
    });
    
});
app.post("/campgrounds",middleware.isLoggedIn, function(req, res) {
    var name = req.body.name;
    var image = req.body.image;
    var price = req.body.price;
    var desc =req.body.description;
    var author={
        id:req.user._id,
        username:req.user.username
    };
    var newCampground = { name: name,price:price, image: image,description:desc ,author:author};
   Campground.create(newCampground,function(err,newlyCreated){
      if(err)
      console.log(err);
      else
         res.redirect("/campgrounds");   
   });
   
});
app.get("/campgrounds/new",middleware.isLoggedIn, function(req, res) {
    res.render("campgrounds/new");
});
app.get("/campgrounds/:id",function(req,res){
    Campground.findById(req.params.id).populate("comments").exec(function(err,foundCampgroud){
       if(err || !foundCampgroud){
       req.flash("error","This campground does not exist");
       res.redirect("back");
       console.log(err);
       }
       else{ 
            res.render("campgrounds/show",{campground:foundCampgroud}); 
        }    
        });
  
});

//=====================================

//edit routes for campgrounds
app.get("/campgrounds/:id/edit",middleware.checkCampgroundOwnership,function(req, res) {
  Campground.findById(req.params.id,function(err, foundCampgroud) {
        res.render("campgrounds/edit",{campground:foundCampgroud}); 
      });
});
app.put("/campgrounds/:id",middleware.checkCampgroundOwnership,function(req,res){
    Campground.findByIdAndUpdate(req.params.id,req.body.campground,function(err,updatedCampground){
       if(err)
            res.redirect("/campgrounds");
        else{
            res.redirect("/campgrounds/"+req.params.id);
        }
    });
});

//=========destroy routes==================
app.delete("/campgrounds/:id",middleware.checkCampgroundOwnership,function(req,res){
    Campground.findByIdAndRemove(req.params.id,function(err){
       if(err) 
       {
           res.redirect("/campgrounds");
       }
       else
       res.redirect("/campgrounds");
    });
});


// ************Comments routes ************

app.get("/campgrounds/:id/comments/new",middleware.isLoggedIn,function(req, res) {
    Campground.findById(req.params.id,function(err,campground){
        if(err)
        console.log(err);
        else
          res.render("comments/new",{campground: campground});
    });
  
});
app.post("/campgrounds/:id/comments",middleware.isLoggedIn,function(req,res){
     Campground.findById(req.params.id,function(err,campground){
        if(err)
       { console.log(err);
        res.render("/campgrounds"); 
       }
        else
         Comment.create(req.body.comment,function(err,comment){
             if(err){
             console.log(err);
             req.flash("error","Something is fishy");
             }else{
                    comment.author.id=req.body._id;
                    comment.author.username=req.user.username;
                    comment.save();
                    campground.comments.push(comment);
                    
                    campground.save();
                    req.flash("success","Added your comment");
                    res.redirect("/campgrounds/"+req.params.id);
             }
         });
    });
});
// ===========comment edit routes
app.get("/campgrounds/:id/comments/:comment_id/edit",middleware.checkCommentOwnership,function(req, res) {
    Campground.findById(req.params.id,function(err,foundCampgroud){
       if(err || !foundCampgroud){
           req.flash("error","Campground not found");
          return res.redirect("back");
       }
       
         Comment.findById(req.params.comment_id, function(err, foundComment) {
                if(err){
                req.flash("error","Something is fishy");
                res.redirect("back");
                }
                else{
                     res.render("comments/edit",{campground_id:req.params.id,comment:foundComment});
                }
                
        });
       
    });
});
//comment update
app.put("/campgrounds/:id/comments/:comment_id",middleware.checkCommentOwnership,function(req,res){
    Comment.findByIdAndUpdate(req.params.comment_id,req.body.comment,function(err,updatedComment){
       if(err){
           res.redirect("back");
       }
       else
       {
           res.redirect("/campgrounds/"+req.params.id);
       }
       
    });
});
// Comment Destroy Route
app.delete("/campgrounds/:id/comments/:comment_id",middleware.checkCommentOwnership,function(req,res){
    Comment.findByIdAndRemove(req.params.comment_id,function(err){
        if(err)
        {
            res.redirect("back");
        }
        else
        {
            req.flash("success","Comment deleted");
            res.redirect("/campgrounds/"+req.params.id);
        }
    });
});

//Auth routes
//=====================
app.get("/register",function(req, res) {
    res.render("register");
});
app.post("/register",function(req, res) {
    var newUser = new User({username:req.body.username});
    User.register(newUser,req.body.password,function(err,user){
        if(err)   {
            console.log(err);
            req.flash("error",err.message);
            return res.render("register");
        }
        passport.authenticate("local")(req,res,function(){
            req.flash("success","Welcome to YelpCamp "+ user.username);
            res.redirect("/campgrounds");
        });
    });
    
});
app.get("/login",function(req, res) {
    res.render("login");
});
app.post("/login",passport.authenticate("local",
{
    successRedirect:"/campgrounds",
    failureRedirect:"/login"
    
} ),
    function(req, res) {
    
});
app.get("/logout",function(req, res) {
    req.logout();
    req.flash("success","Logged out");
    res.redirect("/campgrounds");
});

// ===========Middle-Ware=============
// function isLoggedIn(req,res,next){
//     if(req.isAuthenticated()){
//         return next();
//     }
//     res.redirect("/login");
// }
// function checkCampgroundOwnership(req,res,next){
//      if(req.isAuthenticated()){
//              Campground.findById(req.params.id,function(err, foundCampgroud) {
//                 if(err){
//                     res.redirect("back");
//                 }
//                 else{
//                     if(foundCampgroud.author.id.equals(req.user._id))//  ****** cant do == or ===
//                      next();
//                      else
//                      res.redirect("back");
//                 }
//          });
//     }else{
//         res.redirect("back");
//     }
// }
// function checkCommentOwnership(req,res,next){
//      if(req.isAuthenticated()){
                
//              Comment.findById(req.params.comment_id,function(err, foundComment) {
//                 if(err){
//                     res.redirect("back");
//                 }
//                 else{
//                     if(foundComment.author.username ==(req.user.username))//  ****** cant do == or ===
//                      next();
//                      else
//                      res.redirect("back");
//                 }
//          });
//     }else{
//         res.redirect("back");
//     }
// } 
//======================================

app.listen(process.env.PORT, process.env.IP, function() {
    console.log("server Started");
});
