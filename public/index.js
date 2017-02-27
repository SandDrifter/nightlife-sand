console.log("Hello World!");

$("#input-search").keyup(function(event){
    if(event.keyCode == 13){
        $("#btn-search").click();
    }
});

function search() {
  console.log("You clicked the search button!");  
} 

function requestToken(){
     //  $(function() {
             // console.log("domain url" + document.domain);
               // $('#sign-in-with-twitter').on('click', function() {
                    window.location.href = 'https://dynamic-web-application-projects-sanddrifter.c9users.io/login/twitter';
            //    });
           // });
}

function going(barId){
    console.log(barId);
    $.post( "/going", { barId:barId, going:1 }, function(){console.log('going post success!')});
}