module.exports = {

  list:function(req, res){
    products.find({}).exec(function(err, pro){
      if(err){
        console.log(err);
        res.send(500, {error: 'Database Error'});
      }
      console.log(pro);
      res.view('list', {prod:pro});
    });
  },

};
