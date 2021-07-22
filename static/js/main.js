var user_authenticated = false, no_create = true;
var username = "", user_memories = "";
var pages_length, left_page, right_page;
var user_memories_length;

// custom delay function
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function page_turning(id){
    if(user_authenticated && no_create){
        let z_index = $("#"+id).css("z-index");
        let z_index_new = -1*z_index;

        if(z_index < 0){ // left page is clicked
            left_page  -= 1;
            right_page -= 1;
            $("#"+id).css({"z-index" : z_index_new, "animation":"left-to-right 2s forwards"});
        }
        else{ // right page is clicked
            left_page  += 1;
            right_page += 1;
            $("#"+id).css({"animation" : "right-to-left 2s forwards"});
           
            setTimeout(function(){
                $("#"+id).css({"z-index" : z_index_new});
            }, 2021);
        }
    }
}

async function create_page_turning(){
    no_create = false;
    
    let z_index, animation_time = 3000/(pages_length-right_page);

    while(right_page <= pages_length-2)
    {
        $("#right_page_"+right_page).css({"animation":"right-to-left "+animation_time+"ms forwards"});
        await delay(animation_time); 

        z_index = $("#right_page_"+right_page).css("z-index");
        $("#right_page_"+right_page).css({"z-index":(-1*z_index)});
        right_page += 1;
        left_page  += 1;
    }
}

function logout() {
    user_authenticated = false;

    $.ajax({
        type: "POST",
        headers: {'X-CSRFToken' : Cookies.get('csrftoken')}, // as csrf is enabled in django 
        data: {"logout" : "success"},
        success: async function(){
            let z_index, animation_time = 3000/left_page;
            for(let i=left_page; i > 0;i--)
            {
                z_index = $("#right_page_"+i).css("z-index");
                $("#right_page_"+i).css({"z-index":(-1*z_index), 
                                        "animation":"left-to-right "+animation_time+"ms forwards"});
                await delay(animation_time);
            }  

            // To erase the name of the latest logged out user
            $("#diary_name").fadeOut(750);

            // To remove the latest logged out user's pages of memories
            for(let i=2; i <= pages_length; i++){
                $("#right_page_"+i).remove();
            }

            // To add just under the page
            $("#right").append(
                "<div id='right_page_inf' class='page_common rounded-right' style='z-index: -1;\
                background-image: url(\"/static/images/Page.png\");'></div>"
            );

            // To show login form
            setTimeout(function(){
                $("#login_form").fadeIn("slow");
            }, 755);
        },
        error: function(){
            alert("Logout Error");
        }
    });
}

function new_memory_form() {
    no_create = false;
}

function cancel(){
    no_create = true;
}

$(document).ready(function(){

    // login form submission and after consequences
    $("#login_form").on("submit", function(e){
        e.preventDefault(); // prevent default behaviour of browser. in our case it's relaoding.

        $.ajax({
            type: "POST",
            headers: {'X-CSRFToken': Cookies.get('csrftoken')}, // as csrf middleware is enabled in django
            data: $("#login_form").serialize(),
            success: function(returned_data){
                left_page    = 0;
                right_page   = 1;
                pages_length = 3; //front cover, back cover and at least one page for new memory creation
                no_create    = true;

                username = returned_data["username"];
                user_authenticated = returned_data["user_authenticated"];
                user_memories = JSON.parse(returned_data["user_memories"]);

                // To hide login form and show diary name
                $("#login_form").fadeOut(); // default fading speed is 400ms
                $("#diary_name").html("Reminiscence<br>of<br>" + username);

                // To build user's diary pages and add to diary
                user_memories_length = user_memories.length;
                pages_length += Math.floor(user_memories_length / 2);
                if(user_memories_length % 2) pages_length += 1;
                
                $("#right_page_1").css({"z-index" : pages_length}); 
                
                let z_index = pages_length - 1, id = 2, i=1;
                for(i=1; i < user_memories_length; i+=2){
                    $("#right_page_create").before(
                        "<div id='right_page_"+id+"' class='page_common rounded-right' \
                        onclick=\"page_turning('right_page_"+id+"')\" style='z-index:"+z_index+";'> \
                            <div id='right_page_"+id+"_front_date' class='text-left' \
                                style='position:absolute;width:100%;top:20%; left:6%; \
                                backface-visibility:hidden; font-size:0.75rem;'>"
                                +user_memories[i-1]["fields"]["date"] +
                            "</div> \
                            <div id='right_page_"+id+"_back_date' class='text-left' \
                            style='position:absolute;width:100%;top:20%; right:6%; \
                            backface-visibility:hidden; font-size:0.75rem; transform:rotateY(180deg);'>"
                                +user_memories[i]["fields"]["date"]+
                            "</div> \
                            <div id='right_page_"+id+"_front' class='text-justified' \
                            style='backface-visibility:hidden;position:absolute; width:88%; height:54%;\
                            top:23%; left:6%;'>"
                                +user_memories[i-1]["fields"]["memory"]+
                            "</div>\
                            <div id='right_page_"+id+"_back' class='text-justified' \
                            style='backface-visibility:hidden;position:absolute; width:88%; height:54%; \
                            top:23%; left:6%; transform:rotateY(180deg);'>"
                                +user_memories[i]["fields"]["memory"]+
                            "</div>\
                            <div id='right_page_"+id+"_front_create' class='text-right' \
                                onclick='create_page_turning()' style='position:absolute; left:20%;\
                                bottom:10%; backface-visibility:hidden;color: green;\
                                text-shadow: 0px 0px 5px green;'>Create</div>\
                            <div id='right_page_"+id+"_back_create' class='text-right' \
                                onclick='create_page_turning()' style='position:absolute; right:20%;\
                                bottom:10%; backface-visibility:hidden;color: green;\
                                text-shadow: 0px 0px 5px green;transform:rotateY(180deg);'>Create</div>\
                            <div id='right_page_"+id+"_front_logout' class='text-right' onclick='logout()' \
                                style='position:absolute; right:20%;\
                                color: red;text-shadow: 0px 0px 5px red;\
                                bottom:10%; backface-visibility:hidden;'>Close</div>\
                            <div id='right_page_"+id+"_back_logout' class='text-right' onclick='logout()' \
                                style='position:absolute; left:20%;\
                                bottom:10%; backface-visibility:hidden;\
                                color: red;text-shadow: 0px 0px 5px red;\
                                transform:rotateY(180deg);'>Close</div>\
                            <div class='text-center' style='position:absolute;width:100%;\
                            bottom:2%; backface-visibility:hidden;'>"
                                +i+
                            "</div> \
                            <div class='text-center' style='position:absolute;width:100%;\
                            bottom:2%; backface-visibility:hidden;transform:rotateY(180deg);'>"
                                +(i+1)+
                            "</div> \
                        </div>"
                    );
                    z_index -= 1;
                    id += 1;
                }

                if(user_memories.length % 2)
                {
                    $("#right_page_create").before(
                        "<div id='right_page_"+id+"' class='page_common rounded-right' \
                        onclick=\"page_turning('right_page_"+id+"')\" style='z-index:"+z_index+";'> \
                            <div id='right_page_"+id+"_front_date' class='text-left' \
                                style='position:absolute;width:100%;top:20%; left:6%; \
                                backface-visibility:hidden; font-size:0.75rem;'>"
                                +user_memories[i-1]["fields"]["date"] +
                            "</div> \
                            <div id='right_page_"+id+"_back_date' class='text-left' \
                            style='position:absolute;width:100%;top:20%; right:6%; \
                            backface-visibility:hidden; font-size:0.75rem; transform:rotateY(180deg);'>\
                            </div> \
                            <div id='right_page_"+id+"_front' class='text-justified' \
                            style='backface-visibility:hidden;position:absolute; width:88%; height:54%;\
                            top:23%; left:6%;'>"
                                +user_memories[i-1]["fields"]["memory"]+
                            "</div>\
                            <div id='right_page_"+id+"_back' class='text-justified' \
                            style='backface-visibility:hidden;position:absolute; width:88%; height:54%; \
                            top:23%; left:6%; transform:rotateY(180deg);'>\
                            </div>\
                            <div id='right_page_"+id+"_front_create' class='text-right' \
                                onclick='create_page_turning()' style='position:absolute; left:20%;\
                                bottom:10%; backface-visibility:hidden;color: green;\
                                text-shadow: 0px 0px 5px green;'>Create</div>\
                            <div id='right_page_"+id+"_back_create' class='text-right' \
                                onclick='create_page_turning()' style='position:absolute; right:20%;\
                                bottom:10%; backface-visibility:hidden;color: green;\
                                text-shadow: 0px 0px 5px green;transform:rotateY(180deg);'>Create</div>\
                            <div id='right_page_"+id+"_front_logout' class='text-right' onclick='logout()' \
                                style='position:absolute; right:20%;\
                                color: red;text-shadow: 0px 0px 5px red;\
                                bottom:10%; backface-visibility:hidden;'>Close</div>\
                            <div id='right_page_"+id+"_back_logout' class='text-right' onclick='logout()' \
                                style='position:absolute; left:20%;\
                                bottom:10%; backface-visibility:hidden;\
                                color: red;text-shadow: 0px 0px 5px red;\
                                transform:rotateY(180deg);'>Close</div>\
                            <div class='text-center' style='position:absolute;width:100%;\
                            bottom:2%; backface-visibility:hidden;'>"
                                +i+
                            "</div> \
                            <div class='text-center' style='position:absolute;width:100%;\
                            bottom:2%; backface-visibility:hidden;transform:rotateY(180deg);'>"
                                +(i+1)+
                            "</div> \
                        </div>"
                    );                  
                }
                
                setTimeout(function(){
                    $("#diary_name").fadeIn(750);
                }, 750);   
            },
            error: function(){
                alert("Login Error");
            }
        });
    });

    // To create new memory
    $("#new_memory_form").on("submit", function(e){
        no_create = false;
        e.preventDefault();

        $.ajax({
            type: "POST",
            headers: {'X-CSRFToken' : Cookies.get('csrftoken')}, // as csrf is enabled in django
            data: $("#new_memory_form").serialize(),
            success: function(returned_data){
                user_memories = JSON.parse(returned_data["user_memories"]);
                user_memories_length += 1;

                if(user_memories_length % 2 == 0)
                {
                    const last_page_id = pages_length - 2;
                    const last_memory_index = user_memories_length - 1;

                    // date update
                    $("#right_page_"+last_page_id+"_back_date").html(
                        user_memories[last_memory_index]["fields"]["date"]);
                    
                    // memory update
                    $("#right_page_"+last_page_id+"_back").html(
                        user_memories[last_memory_index]["fields"]["memory"]);

                    // Create button
                    $("#right_page_"+last_page_id+"_back_create").html("Create");

                    // Close button
                    $("#right_page_"+last_page_id+"_back_close").html("Close");
                }
                else
                {
                    pages_length += 1;
                    for(let z_index=pages_length, id_no=1; z_index > 3; z_index--)
                    {
                        $("#right_page_"+id_no).css({"z-index" : (-1*z_index)});
                    }

                    const last_page_id = pages_length - 2;
                    const last_memory_index = user_memories_length - 1;
                    $("#right_page_create").before(
                        "<div id='right_page_"+last_page_id+"' class='page_common rounded-right' \
                        onclick=\"page_turning('right_page_"+last_page_id+"')\" style='z-index:3;'> \
                            <div id='right_page_"+last_page_id+"_front_date' class='text-left' \
                                style='position:absolute;width:100%;top:20%; left:6%; \
                                backface-visibility:hidden; font-size:0.75rem;'>"
                                +user_memories[last_memory_index]["fields"]["date"] +
                            "</div> \
                            <div id='right_page_"+last_page_id+"_back_date' class='text-left' \
                            style='position:absolute;width:100%;top:20%; right:6%; \
                            backface-visibility:hidden; font-size:0.75rem; transform:rotateY(180deg);'>\
                            </div> \
                            <div id='right_page_"+last_page_id+"_front' class='text-justified' \
                            style='backface-visibility:hidden;position:absolute; width:88%; height:54%;\
                            top:23%; left:6%;'>"
                                +user_memories[last_memory_index]["fields"]["memory"]+
                            "</div>\
                            <div id='right_page_"+last_page_id+"_back' class='text-justified' \
                            style='backface-visibility:hidden;position:absolute; width:88%; height:54%; \
                            top:23%; left:6%; transform:rotateY(180deg);'>\
                            </div>\
                            <div id='right_page_"+last_page_id+"_front_create' class='text-right' \
                                onclick='create_page_turning()' style='position:absolute; left:20%;\
                                color: green;text-shadow: 0px 0px 5px green;\
                                bottom:10%; backface-visibility:hidden;'>Create</div>\
                            <div id='right_page_"+last_page_id+"_back_create' class='text-right' \
                                onclick='create_page_turning()' style='position:absolute; right:20%;\
                                color: green;text-shadow: 0px 0px 5px green;\
                                bottom:10%; backface-visibility:hidden;\
                                transform:rotateY(180deg);'>Create</div>\
                            <div id='right_page_"+last_page_id+"_front_logout' class='text-right' \
                                onclick='logout()' style='position:absolute; right:20%;\
                                color: red;text-shadow: 0px 0px 5px red;\
                                bottom:10%; backface-visibility:hidden;'>Close</div>\
                            <div id='right_page_"+last_page_id+"_back_logout' class='text-right' \
                                onclick='logout()' style='position:absolute; left:20%;\
                                bottom:10%; backface-visibility:hidden;\
                                color: red;text-shadow: 0px 0px 5px red;\
                                transform:rotateY(180deg);'>Close</div>\
                            <div class='text-center' style='position:absolute;width:100%;\
                            bottom:2%; backface-visibility:hidden;'>"
                                +user_memories_length+
                            "</div> \
                            <div class='text-center' style='position:absolute;width:100%;\
                            bottom:2%; backface-visibility:hidden;transform:rotateY(180deg);'>"
                                +(user_memories_length+1)+
                            "</div> \
                        </div>"
                    );
                }

                no_create = true;
            },
            error: function(){
                alert("New memory creation error!");
                no_create = true;
            }
        });
    });
});