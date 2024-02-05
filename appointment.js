const fs = require('fs'); 

const readline = require('node:readline').createInterface({
    input: process.stdin,
    output: process.stdout,
});


function process_input(file_name_string){   
    return new Promise((resolve, reject) => {
        
        fs.readFile(file_name_string, (err, data) =>{
            if (err){
                console.log("Please try again."); 
            } else {

                let file_data = data.toString(); 
                let if_cal_end = false;
                let if_cal_begin = false; 
                let if_rec_begin = false; 
                let if_rec_end = false; 
                let if_whitespace = false; 
                
                let current_record = "";
                let records = []; 

                let lines = file_data.split('\n');

                let meets_qty_req = true; 

                let contains_whitespace = lines.some(line => /^\s*$/.test(line));
                if (contains_whitespace){
                    if_whitespace = true; 
                    console.log("There is white-space in your file. Please delete it."); 
                }

                file_data.split(/\r?\n/).forEach(line =>  {

                    if ((line.toLowerCase()).includes("begin:vcalendar")){
                        if_rec_begin = true; 
                    }

                    if ((line.toLowerCase()).includes("end:vcalendar")){
                        if_rec_end = true; 
                    }

                    if (if_rec_end == false){
                        if ((line.toLowerCase()).includes("begin:vevent")){
                            if_cal_begin = true;  
                            if_cal_end = false; 
                        } 
    
                        if ((if_cal_begin == true) && (if_cal_end == false)){ 
                            current_record += (line + "\n"); 
                        }
                        
                        if ((line.toLowerCase()).includes("end:vevent")){ 
                            records.push(current_record); 
                            if_cal_end = true;  
                            if_cal_begin = false; 
                            current_record = ""; 
                        }
                    }
                    
                });

                let check_records = []; 

                // Check the basic requirements for quantity
                for (let i = 0; i < records.length; i++){
                    record_i = split_record(records[i]); // record_i is the array storing the individual lines of the current record
                    check_records.push(check_requirements(record_i)); 
                } 
                meets_qty_req = are_any_false(check_records); 
                
                // Check if the attendee value is an email or a phone number
                
            } 
        }); 

        // resolve(true); // will need to change this eventually
    });

} 


function getFileName(){
    readline.question(`\n\nEnter the name of your iCalendar text file with the extension included (i.e. records.txt) [enter 'Q' to exit]\nPlease Note >> input files are sensitive to whitespace, however they are not case sensitive. \n`, input_file_name => {
        fs.readdir('.', (err, files) => {
            if (err) {
              console.error(err);
              return;
            }

            if (input_file_name === "Q" || input_file_name === 'q'){
                process.exit(); 
            }

            if (files.includes(input_file_name)) {
                let check_it_works = false; 
                check_it_works = process_input(input_file_name);
                setTimeout(function() {
                    getFileName(); 
                }, 20);
                  
            } else {
                console.log(`${input_file_name} does not exist in the current directory. Please enter a new file name.`);
                getFileName(); 
            }
            
        });
         
    });
}


function split_record(record){
    let record_contents = []; 

    record.split(/\r?\n/).forEach(line =>  {
        record_contents.push(line); 
    });

    record_contents.pop(); // Gets rid of the extra new line at the end of each record

    return record_contents; 
}

function check_requirements(record_array){
    
    // required
    let prodid_count = 0; 
    let version_count = 0; 
    let attendee_count = 0; 
    let dtstart_count = 0; 
    let dtstamp_count = 0; 
    let method_count = 0; 
    let status_count = 0; 
    let unknown_count = 0; 

    let summary_count = 0; // optional 
    let orgname_count = 0; // optional 

    let valid_vevent = true;
    

    for (let i = 0; i < record_array.length; i++){
        if ((record_array[i].toLowerCase()).includes("prodid")){
            prodid_count++; 
        } else if ((record_array[i].toLowerCase()).includes("version")){
            version_count++; 
        } else if ((record_array[i].toLowerCase()).includes("attendee")){
            attendee_count++; 
        } else if ((record_array[i].toLowerCase()).includes("dtstart")){
            dtstart_count++; 
        } else if ((record_array[i].toLowerCase()).includes("dtstamp")){
            dtstamp_count++; 
        } else if ((record_array[i].toLowerCase()).includes("method")) {
            method_count++; 
        } else if ((record_array[i].toLowerCase()).includes("status")){
            status_count++; 
        } else if ((record_array[i].toLowerCase()).includes("summary")){
            summary_count++; 
        } else if ((record_array[i].toLowerCase()).includes("organizer")){
            orgname_count++; 
        } else if (!((record_array[i].toLowerCase()).includes("begin") || (record_array[i].toLowerCase()).includes("end"))){
            unknown_count++; 
        }

    }
    
    if (prodid_count != 1){
        console.log("Please ensure you have one PRODID property."); 
        valid_vevent = false;

    } 
    
    if (version_count != 1){
        console.log("Please ensure you have one VERSION property."); 
        valid_vevent = false;

    } 
    
    if (attendee_count != 1){
        console.log("Please ensure you have one ATTENDEE property."); 
        valid_vevent = false;

    } 
    
    if (dtstart_count != 1){
        console.log("Please ensure you have one DTSTART property."); 
        valid_vevent = false;
    } 
    
    if (dtstamp_count != 1){
        console.log("Please ensure you have one DTSTAMP property."); 
        valid_vevent = false;

    } 
    
    if (method_count != 1){
        console.log("Please ensure you have one METHOD property."); 
        valid_vevent = false;

    } 
    
    if (status_count != 1){
        console.log("Please ensure you have one STATUS property."); 
        valid_vevent = false;

    }
    
    if (summary_count > 1){
        console.log("You may not have more than one SUMMARY property.");
        valid_vevent = false; 
    }

    if (orgname_count > 1){
        console.log("You may not have more than one ORGANIZER property."); 
        valid_vevent = false; 
    }

    return valid_vevent; 

}

function check_attendee(record_array){
    let atd_line = ""; 
    let valid_value = true; 
    let atd_arr = [];
    let atd_val = []; 
    const email_regex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    const phone_regex = /^\d{3}-?\d{3}-?\d{4}$/;



    for (let i = 0; i < record_array.length; i++){
        if ((record_array[i].toLowerCase()).includes("attendee")){
            atd_line = record_array[i]; 
        }
    }

    if (atd_line.includes(":")){

    } else {
        atd_arr = atd_line.split(":"); 
        if (atd_arr > 2){
            // there are more than 2 values after you split, so it's invalid
            console.log("Please check your file for a formatting issue under ATTENDEE."); 
            valid_value = false; 
        } else {
            atd_val = atd_arr[atd_arr.length - 1]; 
            if (email_regex.test(atd_val) || phone_regex.test(atd_val)){
                // matches the regex
            }
        }
    }

    return valid_value; 

}


function are_any_false(arr){
    for (let i = 0; i < arr.length; i++){
        if (arr[i] == false){
            return false; 
        }
    }

    return true; 
}

getFileName(); 