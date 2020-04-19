var Campground=require("../models/campground");
var Comment=require("../models/comment");
var middlewareObj={};

middlewareObj.isLoggedIn=function (req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error","You need to be logged in!!");
    res.redirect("/login");
};
middlewareObj.checkCampgroundOwnership=function (req,res,next){
     if(req.isAuthenticated()){
             Campground.findById(req.params.id,function(err, foundCampgroud) {
                if(err || !foundCampgroud){
                    req.flash("error","Campground not found");
                    res.redirect("back");
                }
                else{
                    if(foundCampgroud.author.id.equals(req.user._id))//  ****** cant do == or ===
                     next();
                     else
                     {req.flash("error","you dont have permission!!!")
                     res.redirect("back");}
                }
         });
    }else{
        req.flas("error","You need to be logged in!!");
        res.redirect("back");
    }
};
middlewareObj.checkCommentOwnership=function (req,res,next){
     if(req.isAuthenticated()){
                
             Comment.findById(req.params.comment_id,function(err, foundComment) {
                if(err || !foundComment){
                    req.flash("error","comment not found");
                    res.redirect("back");
                }
                else{
                    if(foundComment.author.username ==(req.user.username))//  ****** cant do == or ===
                     next();
                     else
                     {
                     res.redirect("back");
                     req.flash("error","It is not your comment");
                     }
                }
         });
    }else{
        req.flash("error","You need to be logged in");
        res.redirect("back");
    }
} ;
module.exports=middlewareObj;