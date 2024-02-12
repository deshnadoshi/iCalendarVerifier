const fs = require('fs'); 

const readline = require('node:readline').createInterface({
    input: process.stdin,
    output: process.stdout,
});

const optional_properties = ["class", "created", "description", 
"geo", "last-mod", "location", "organizer", "priority", 
"seq", "summary", "transp", "url", "recurid", 
"rrule", "dtend", "duration", "attach", 
"categories", "comment", "contact", "exdate", "rstatus", 
"related", "resources", "rdate", "x-prop", "iana-prop"
]; 

/**
 * Processes the input from the command line and determine if a given VEVENT is valid or not. 
 */
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
                let meets_att_req = true; 
                let meets_met_req = true; 
                let meets_stat_req = true; 
                let meets_dtstamp_req = true; 
                let meets_dtstart_req = true; 
                let meets_version_req = true; 
                let meets_cal_req = true; 
                let is_repeat = false;  

                let begin_counter = 0; 
                let end_counter = 0;

                let outside_record = []; 

                let contains_whitespace = lines.some(line => /^\s*$/.test(line));
                if (contains_whitespace){
                    if_whitespace = true; 
                }

                file_data.split(/\r?\n/).forEach(line =>  {
                     
                    if ((line.toLowerCase()).includes("begin:vcalendar")){
                        if_rec_begin = true; 
                    }

                    if ((line.toLowerCase()).includes("end:vcalendar")){
                        if_rec_end = true; 
                    }

                    if (if_rec_begin == true && if_rec_end == false && (if_cal_begin == false || if_cal_end == true)){
                        outside_record.push(line); 
                    }

                    if (if_rec_end == false){
                        if ((line.toLowerCase()).includes("begin:vevent")){
                            begin_counter++; 
                            if_cal_begin = true;  
                            if_cal_end = false; 
                        } 
    
                        if ((if_cal_begin == true) && (if_cal_end == false)){ 
                            current_record += (line + "\n"); 
                        }
                        
                        if ((line.toLowerCase()).includes("end:vevent")){ 
                            end_counter++; 
                            records.push(current_record); 
                            if_cal_end = true;  
                            if_cal_begin = false; 
                            current_record = ""; 
                        }
                    }


                    
                });                

                if (begin_counter < 1 || end_counter < 1){
                    console.log("You must have at least one VEVENT in your file. Please edit the file and try again."); 
                    resolve(false); 
                } else {

                    meets_cal_req = check_calendar(outside_record); 

                    let check_records = []; 

                    // Check the basic requirements for quantity
                    for (let i = 0; i < records.length; i++){
                        record_i = split_record(records[i]); // record_i is the array storing the individual lines of the current record
                        check_records.push(check_requirements(record_i)); 
                    } 

                    meets_qty_req = are_any_false(check_records); 
                    
                    // Check if the attendee value is an email or a phone number
                    check_records = []; 
                    for (let i = 0; i < records.length; i++){
                        record_i = split_record(records[i]); // record_i is the array storing the individual lines of the current record
                        check_records.push(check_attendee(record_i)); 
                    } 
    
                    meets_att_req = are_any_false(check_records); 
                    
                    // Check if the method value is request
                    check_records = []; 
                    for (let i = 0; i < records.length; i++){
                        record_i = split_record(records[i]); // record_i is the array storing the individual lines of the current record
                        check_records.push(check_method(record_i)); 
                    } 
    
                    meets_met_req = are_any_false(check_records); 
                    
                    // Check if the status value is tentative, cancelled, or confirmed
                    check_records = []; 
                    for (let i = 0; i < records.length; i++){
                        record_i = split_record(records[i]); // record_i is the array storing the individual lines of the current record
                        check_records.push(check_status(record_i)); 
                    } 
    
                    meets_stat_req = are_any_false(check_records); 
    
                    // Check dtstamp
                    meets_dtstamp_req = check_dtstamp(records); 
    
                    // Check dtstart
                    meets_dtstart_req = check_dtstart(records); 

                    is_repeat = check_per_day(records); 

                    let is_chronology = false; 
                    is_chronology = check_chronology(records); 

    
    
                    if (meets_qty_req == true && meets_att_req == true && meets_met_req == true && meets_stat_req == true && meets_dtstamp_req == true && meets_dtstart_req == true && meets_cal_req == true && is_repeat == false && is_chronology == true){
                        console.log("The VEVENT has been verified. It contains no errors."); 
                        resolve(true); 
                    } else {
                        console.log("\n--YOU HAVE THE AFOREMENTIONED ISSUES IN YOUR RECORDS FILE. PLEASE EDIT THE FILE AND TRY AGAIN.--"); 
                        resolve(false); 
                    }
    
                }

                
                
            } 
        }); 

    });

} 

/**
 * Processes file input and determines if it is in the current directory or not. 
 */
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

/**
 * Splits a selected VEVENT into its individual properties and values. 
 */
function split_record(record){
    let record_contents = []; 

    record.split(/\r?\n/).forEach(line =>  {
        record_contents.push(line); 
    });

    record_contents.pop(); // Gets rid of the extra new line at the end of each record

    return record_contents; 
}

/**
 * Checks for the basic requirements.
 */
function check_requirements(record_array){
    
    // required
    let prodid_count = 0; 
    let version_count = 0; 
    let attendee_count = 0; 
    let dtstart_count = 0; 
    let dtstamp_count = 0; 
    let method_count = 0; 
    let status_count = 0; 
    let optional_count = 0; 
    let unknown_count = 0; 

    let valid_vevent = true;
    

    for (let i = 0; i < record_array.length; i++){
        if ((record_array[i].toLowerCase()).includes("attendee")){
            attendee_count++; 
        } else if ((record_array[i].toLowerCase()).includes("dtstart")){
            dtstart_count++; 
        } else if ((record_array[i].toLowerCase()).includes("dtstamp")){
            dtstamp_count++; 
        } else if ((record_array[i].toLowerCase()).includes("method")) {
            method_count++; 
        } else if ((record_array[i].toLowerCase()).includes("status")){
            status_count++; 
        } else if (!((record_array[i].toLowerCase()).includes("begin") || (record_array[i].toLowerCase()).includes("end"))){
            // check optional or non existent properties here
            record_array.forEach(element => {
                let element_new = element.split(":")[0].toLowerCase(); 
                if (optional_properties.includes(element_new)) {
                    optional_count++;
                } else {
                    if ((!(element_new === ("begin") || element_new === ("end") || element_new === ("attendee")|| element_new === ("status") || element_new === ("dtstart") || element_new === ("dtstamp") || element_new ===("method")))){
                        unknown_count++;
                    }
                    
                    
                }
            });
            
        }

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
    
    if (optional_count > 0){
        console.log("WARNING: You have one (or more) optional properties."); 
    }

    if (unknown_count > 0){
        console.log("ERROR: You have one (or more) unknown properties."); 
        valid_vevent = false; 
    }

    return valid_vevent; 

}

/**
 * Check for more than one appointment per day.
 */

function check_per_day(record_array){
    let time_str_array = [];
    let time_arr = []; 

    for (let i = 0; i < record_array.length; i++){
        record_i = split_record(record_array[i]); 
        for (let j = 0; j < record_i.length; j++){
            if ((record_i[j].toLowerCase()).includes("dtstart")){
                time_str_array.push(record_i[j]); 
            }
        }
    }

    for (let i = 0; i < time_str_array.length; i++){
        if (time_str_array[i].includes(":")){
            let time_val = []; 
            time_val = time_str_array[i].split(":"); 
            if (time_val.length > 2 || time_val.length < 1){
                is_time_valid = false; 
                break; 
            } else {
                time_arr.push(time_val[1]); 
            }
        }
    }

    let day_val = []; 
    for (let i = 0; i < time_arr.length; i++){
        if (time_arr[i].includes("T")){
            day_val.push(time_arr[i].split("T")[0]); 
        }
    }

    let is_dup = false; 

    for (let i = 0; i < day_val.length - 1; i++) {
        for (let j = i + 1; j < day_val.length; j++) {
          if (day_val[i] === day_val[j]) {
            is_dup = true;
          }
        }
      }

      if (is_dup){
        console.log("DTSTART values must be unique for each VEVENT. The doctor only admits one patient per day."); 
      }
    
      return is_dup; 

}

/**
 * Checks if the ATTENDEE value is valid. 
 */
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
        atd_arr = atd_line.split(":"); 
        if (atd_arr > 2){
            // there are more than 2 values after you split, so it's invalid
            console.log("Please check your file for a formatting issue under ATTENDEE."); 
            valid_value = false; 
        } else {
            atd_val = atd_arr[atd_arr.length - 1]; 
            if (email_regex.test(atd_val) || phone_regex.test(atd_val)){
                // only need to verify here, so just set it equal to true
                valid_value = true; 
            } else {
                valid_value = false; 
                console.log("Please check your file for a VALUE issue under ATTENDEE. The VALUE must be an email or a 10-digit phone number."); 
            }
        }

    } else {
        console.log("Please check your file for a formatting issue under ATTENDEE"); 
    }

    return valid_value; 

}

/**
 * Checks if the METHOD value is valid.
 */
function check_method(record_array){
    let mtd_line = ""; 
    let valid_value = true; 
    let mtd_arr = [];
    let mtd_val = []; 


    for (let i = 0; i < record_array.length; i++){
        if ((record_array[i].toLowerCase()).includes("method")){
            mtd_line = record_array[i]; 
        }
    }

    if (mtd_line.includes(":")){
        mtd_arr = mtd_line.split(":"); 
        if (mtd_arr > 2){
            // there are more than 2 values after you split, so it's invalid
            console.log("Please check your file for a formatting issue under METHOD."); 
            valid_value = false; 
        } else {
            mtd_val = mtd_arr[mtd_arr.length - 1]; 
            if (mtd_val.toLowerCase() === "request"){
                // only need to verify here, so just set it equal to true
                valid_value = true; 
            } else {
                valid_value = false; 
                console.log("Please check your file for a VALUE issue under METHOD. The VALUE must be REQUEST."); 
            }
        }

    } else {
        console.log("Please check your file for a formatting issue under METHOD"); 
    }

    return valid_value; 
}

/**
 * Checks if the STATUS value is valid. 
 */
function check_status(record_array){

    let status_line = ""; 
    let valid_value = true; 
    let status_arr = [];
    let status_val = []; 


    for (let i = 0; i < record_array.length; i++){
        if ((record_array[i].toLowerCase()).includes("status")){
            status_line = record_array[i]; 
        }
    }

    if (status_line.includes(":")){
        status_arr = status_line.split(":"); 
        if (status_arr > 2){
            // there are more than 2 values after you split, so it's invalid
            console.log("Please check your file for a formatting issue under STATUS."); 
            valid_value = false; 
        } else {
            status_val = status_arr[status_arr.length - 1]; 
            if (status_val.toLowerCase() === "tentative" || status_val.toLowerCase() === "confirmed" || status_val.toLowerCase() === "cancelled"){
                // only need to verify here, so just set it equal to true
                valid_value = true; 
            } else {
                valid_value = false; 
                console.log("Please check your file for a VALUE issue under STATUS. The VALUE must be TENTATIVE, CONFIRMED, or CANCELLED."); 
            }
        }

    } else {
        console.log("Please check your file for a formatting issue under STATUS"); 
    }

    return valid_value; 


}

/**
 * Checks if the value of the DTSTAMP parameter is valid. 
 */
function check_dtstamp(all_records_array){

    let time_str_array = []; 
    let time_arr = []; 
    let is_time_valid = true; 
    let is_format_correct = []; 
    let is_date_nums_valid = []; 

    for (let i = 0; i < all_records_array.length; i++){
        record_i = split_record(all_records_array[i]); 
        for (let j = 0; j < record_i.length; j++){
            if ((record_i[j].toLowerCase()).includes("dtstamp")){
                time_str_array.push(record_i[j]); 
            }
        }
    }

    if (time_str_array.length < 1){
        console.log("Please check your file for a formatting issue under DTSTAMP"); 
    }

    for (let i = 0; i < time_str_array.length; i++){
        if (time_str_array[i].includes(":")){
            let time_val = []; 
            time_val = time_str_array[i].split(":"); 
            if (time_val.length > 2 || time_val.length < 1){
                console.log("Please check your file for a formatting issue under DTSTAMP.");  
                is_time_valid = false; 
                break; 
            } else {
                time_arr.push(time_val[1]); 
            }
        } else {
            is_time_valid = false; 
            console.log("Please check your file for a formatting issue under DTSTAMP.");  
            break; 
        }
        
    }

    if (time_str_array.length == time_arr.length){

        for (let i = 0; i < time_arr.length; i++){
            is_format_correct.push(check_input_date(time_arr[i])); 
        }

        for (let i = 0; i < is_format_correct.length; i++){
            if (is_format_correct[i] == false){
                is_time_valid = false; 
                console.log("Please check your file for a formatting issue under DTSTAMP.");  
            }
        }

        if (is_time_valid == true){
            // so there are no issues with format thus far
            for (let i = 0; i < time_arr.length; i++){
                is_date_nums_valid.push(check_valid_date(time_arr[i])); 
            }
            
            for (let i = 0; i < is_date_nums_valid.length; i++){
                if (is_date_nums_valid[i] == false){
                    is_time_valid = false; 
                    console.log("Please check your file for a VALUE issue under DTSTAMP.");  
                }
            }
        }

    }

    return is_time_valid; 

}


/**
 * Checks if the value of the DTSTART parameter is valid. 
 */
function check_dtstart(all_records_array){

    let time_str_array = []; 
    let time_arr = []; 
    let is_time_valid = true; 
    let is_format_correct = []; 
    let is_date_nums_valid = []; 

    for (let i = 0; i < all_records_array.length; i++){
        record_i = split_record(all_records_array[i]); 
        for (let j = 0; j < record_i.length; j++){
            if ((record_i[j].toLowerCase()).includes("dtstart")){
                time_str_array.push(record_i[j]); 
            }
        }
    }

    if (time_str_array.length < 1){
        console.log("Please check your file for a formatting issue under DTSTART"); 
    }

    for (let i = 0; i < time_str_array.length; i++){
        if (time_str_array[i].includes(":")){
            let time_val = []; 
            time_val = time_str_array[i].split(":"); 
            if (time_val.length > 2 || time_val.length < 1){
                console.log("Please check your file for a formatting issue under DTSTART.");  
                is_time_valid = false; 
                break; 
            } else {
                time_arr.push(time_val[1]); 
            }
        } else {
            is_time_valid = false; 
            console.log("Please check your file for a formatting issue under DTSTART.");  
            break; 
        }
        
    }

    if (time_str_array.length == time_arr.length){
        // if their lengths arent the same it means tht some of the times were invalid
        // if their lengths ARE the same it means that all the entries are valid and so now i can check them for formatting
        // console.log(time_arr); 

        for (let i = 0; i < time_arr.length; i++){
            is_format_correct.push(check_input_date(time_arr[i])); 
        }

        for (let i = 0; i < is_format_correct.length; i++){
            if (is_format_correct[i] == false){
                is_time_valid = false; 
                console.log("Please check your file for a formatting issue under DTSTART.");  
            }
        }

        if (is_time_valid == true){
            // so there are no issues with format thus far
            for (let i = 0; i < time_arr.length; i++){
                is_date_nums_valid.push(check_valid_date(time_arr[i])); 
            }
            
            for (let i = 0; i < is_date_nums_valid.length; i++){
                if (is_date_nums_valid[i] == false){
                    is_time_valid = false; 
                    console.log("Please check your file for a VALUE issue under DTSTART.");  
                }
            }
        }

        if (is_time_valid == true){
            for (let i = 0; i < time_arr.length; i++){
                is_date_nums_valid.push(check_day_available(time_arr[i])); 
            }
            
            for (let i = 0; i < is_date_nums_valid.length; i++){
                if (is_date_nums_valid[i] == false){
                    is_time_valid = false; 
                    console.log("Please check your file for a VALUE issue under DTSTART.");  
                }
            }
        }

    }

    return is_time_valid; 

}

/**
 * Checks if the value of VERSION is valid. 
 */
function check_version(record_array){
    let ver_line = ""; 
    let valid_value = true; 
    let ver_arr = [];
    let ver_val = []; 
    const version_regex = /^\d+(\.\d+)*$/


    for (let i = 0; i < record_array.length; i++){
        if ((record_array[i].toLowerCase()).includes("version")){
            ver_line = record_array[i]; 
        }
    }

    if (ver_line.includes(":")){
        ver_arr = ver_line.split(":"); 
        if (ver_arr > 2){
            // there are more than 2 values after you split, so it's invalid
            console.log("Please check your file for a formatting issue under VERSION."); 
            valid_value = false; 
        } else {
            ver_val = ver_arr[ver_arr.length - 1]; 
            if (version_regex.test(ver_val)){
                // only need to verify here, so just set it equal to true
                valid_value = true; 
            } else {
                valid_value = false; 
                console.log("Please check your file for a VALUE issue under VERSION. The VALUE must be an numerical and may contain periods. The VALUE may not end with a period."); 
            }
        }

    } else {
        console.log("Please check your file for a formatting issue under VERSION"); 
    }

    return valid_value; 

}

/**
 * Checks if the required values for an iCalendar file exist and are valid. 
 */
function check_calendar(out_array){

    prodid_line = ""; 
    version_line = ""; 
    version_arr = []; 
    is_valid_cal = true; 
    const version_regex = /^\d+(\.\d+)*$/


    for (let i = 0; i < out_array.length; i++){
        if ((out_array[i].toLowerCase()).includes("prodid")){
            prodid_line = out_array[i]; 
        }
    }

    for (let i = 0; i < out_array.length; i++){
        if ((out_array[i].toLowerCase()).includes("version")){
            version_line = out_array[i]; 
        }
    }

    if (version_line === ""){
        console.log("Please ensure you have one VERSION property."); 
        is_valid_cal = false;
    } else {
        version_arr = version_line.split(":"); 
        if (version_arr.length != 2){
            console.log("Please check your file for a formatting issue under VERSION"); 
        } else {
            if (version_regex.test(version_arr[1])){
                is_valid_cal = true; 
            } else {
                is_valid_cal = false; 
                console.log("Please check your file for a VALUE issue under VERSION. The VALUE must be an numerical and may contain periods. The VALUE may not end with a period."); 
            }
        }
    }

    if (prodid_line === ""){
        console.log("Please ensure you have one PRODID property."); 
        is_valid_cal = false; 
    }


    return is_valid_cal; 

}


/**
 * Ensure that DTSTAMP values occure before DTSTART values.
 */
function check_chronology(record_array){

    let dtstart_arr = []; 
    let dtstamp_arr = []; 

    for (let i = 0; i < record_array.length; i++){
        record_i = split_record(record_array[i]); 
        for (let j = 0; j < record_i.length; j++){
            if ((record_i[j].toLowerCase()).includes("dtstart")){
                dtstart_arr.push(record_i[j].split(":")[1]); 
            }
        }
    }

    for (let i = 0; i < record_array.length; i++){
        record_i = split_record(record_array[i]); 
        for (let j = 0; j < record_i.length; j++){
            if ((record_i[j].toLowerCase()).includes("dtstamp")){
                dtstamp_arr.push(record_i[j].split(":")[1]); 
            }
        }
    }

    let dtstart_date_arr = []; 
    let dtstamp_date_arr = []; 

    for (let i = 0; i < dtstart_arr.length; i++){
        dtstart_date_arr.push(get_date_obj(dtstart_arr[i])); 
    }


    for (let i = 0; i < dtstamp_arr.length; i++){
        dtstamp_date_arr.push(get_date_obj(dtstamp_arr[i])); 
    }


    let is_after = true; 

    for (let i = 0; i < dtstamp_arr.length; i++) {
        if (dtstart_date_arr[i] <= dtstamp_date_arr[i]) {
          is_after = false;
        }
      }    

    if (!is_after){
        console.log("Please ensure that your DTSTAMP values occur before your DTSTART values."); 
    }

    return is_after;

}

function get_date_obj(cmd_input){
    date_info = cmd_input.substring(0, 8); // All of the data before the 'T', represents the date
    time_info = cmd_input.substring(9); // All of the data after the 'T', represents the time

    year = date_info.substring(0, 4); 
    month = date_info.substring(4, 6); 
    day = date_info.substring(6); 

    hour = time_info.substring(0, 2); 
    min = time_info.substring(2, 4); 
    sec = time_info.substring(4);

    date_arg = year + "-" + month + "-" + day + "T" + hour + ":" + min + ":" + sec; 

    date_obj = new Date(date_arg); 
    return date_obj; 
}


/**
 * Determines if the chosen date and time is valid. 
 * Checks for maximum and minimum possible values of each field. 
 * @param {} check_date The date inputted by the user. 
 * @returns True if the date is valid, false otherwise. 
 */
function check_valid_date(check_date){
    is_valid_date = true; // Assuming the format is valid, we can split up the date
    
    let year = parseInt(date_split(check_date).year);
    let month = parseInt(date_split(check_date).month);
    let day = parseInt(date_split(check_date).day);
    let hour = parseInt(date_split(check_date).hour);
    let min = parseInt(date_split(check_date).min);
    let sec = parseInt(date_split(check_date).sec); 


    // Check for month and day. 
    if (month > 12 || month < 1){
        console.log("The month is invalid."); 
        is_valid_date = false; 
    }

    if (day > 31 || day < 1){ 
        console.log("The day is invalid."); 
        is_valid_date = false; // Basic check for date range (need to implement check for specific days)
    }


    if (match_month(year, month, day) == false){
        console.log("The number of days does not match the month or year."); 
        // Checks if the month matches the month
        is_valid_date = false; 
    }

    if (hour > 23 || hour < 0){
        console.log("HOURS are invalid."); 
        is_valid_date = false; 
    }

    if (min > 59 || min < 0){
        console.log("MINUTES are invalid."); 
        is_valid_date = false; 
    }

    if (sec > 59 || sec < 0){
        console.log("SECONDS are invalid."); 
        is_valid_date = false; 
    }
      


    
    return is_valid_date; 

}

/**
 * Determines if the number of days matches the month. 
 * For example, if the month is January, the maximum number of days it can have is 31. 
 * @param {*} year_num The value of the year. 
 * @param {*} month_num The value of the monht. 
 * @param {*} days_num The value of the day. 
 * @returns 
 */
function match_month(year_num, month_num, days_num){
    if (month == 1 || month == 3 || month == 5 || month == 7 || month == 8 || month == 10 || month == 12){
        if (days_num > 31 || days_num <= 0){
            return false; 
        }
    } else if (month == 4 || month == 6 || month == 9 || month == 11){
        if (days_num > 30 || days_num <= 0){
            return false; 
        }
    } else if (month == 2){
        if (is_leap_year(year_num)){ // If February is a leap year, the days should be less than 29
            if (days_num > 29 || days_num < 0){
                return false; 
            }
        } else {
            if (days_num > 28 || days_num < 0){
                return false; 
            }
        }
    }

    return true; 
}

/**
 * Determines if a given year is a leap year. 
 * @param {} year_num The value of the year. 
 * @returns True if the given year is a leap year, false otherwise. 
 */
function is_leap_year (year_num){
    if (year_num % 4 == 0){
        if (year_num % 100 == 0){
            if (year_num % 400 == 0){
                return true;
            } else {
                return false;
            }
        } else {
            return true;
        }
    }

    return false;
}

/**
 * Determines if the entered date is of the correct format. 
 * @param {*} check_date The date entered by the user.  
 * @returns True if the date is valid, false otherwise. 
 */
function check_input_date(check_date){
    matched = false; 
    // YYYY MM DD T HH MM SS
    let date_regex = /[0-9][0-9][0-9][0-9][0-1][0-9][0-2][0-9]T[0-2][0-9][0-5][0-9][0-5][0-9]/;
    if (date_regex.test(check_date)){
        matched = true; 
    }

    if (!matched){
        console.log("DTSTAMP and DTSTART values must follow the format: YYYYMMDDTHHMMSS."); 
    }

    return matched; 
}

/**
 * Splits the date apart into year, month, day, hour, minute, and second. 
 * @param {} cmd_input The date entered by the user. 
 * @returns The different components of the date (such as, year, month, etc.). 
 */
function date_split(cmd_input){
    date_info = cmd_input.substring(0, 8); // All of the data before the 'T', represents the date
    time_info = cmd_input.substring(9); // All of the data after the 'T', represents the time

    year = date_info.substring(0, 4); 
    month = date_info.substring(4, 6); 
    day = date_info.substring(6); 

    hour = time_info.substring(0, 2); 
    min = time_info.substring(2, 4); 
    sec = time_info.substring(4); 

    return {
        year: year,
        month: month,
        day: day,
        hour: hour,
        min: min,
        sec: sec
    };

}

/**
 * Creating a Date object from the command line input. 
 */
function check_day_available(cmd_input){
    let meets_day_req  = true; 

    date_info = cmd_input.substring(0, 8); // All of the data before the 'T', represents the date
    time_info = cmd_input.substring(9); // All of the data after the 'T', represents the time

    year = date_info.substring(0, 4); 
    month = date_info.substring(4, 6); 
    day = date_info.substring(6); 

    hour = time_info.substring(0, 2); 
    min = time_info.substring(2, 4); 
    sec = time_info.substring(4);

    date_arg = year + "-" + month + "-" + day + "T" + hour + ":" + min + ":" + sec; 

    date_obj = new Date(date_arg);  
    
    if (date_obj.getDay() === 0) {
        meets_day_req = false; 
        console.log('DTSTART falls on a Sunday. The office is closed on Sundays. Please choose another day.');
    } 

    if (!(date_obj.getHours() >= 9 && date_obj.getHours() <= 15)){
        meets_day_req = false; 
        console.log('DTSTART falls outside of 9 AM to 3 PM. The office is closed before 9 AM and after 3 PM. Please choose another time.');

    }

    if (!is_future_date(cmd_input)){
        meets_day_req = false; 
        console.log("DTSTART is not a future date. You may only schedule appointments at future dates."); 
    }

    if (date_obj.getFullYear() > 2050){
        meets_day_req = false; 
        console.log("You may not schedule an appointment beyond the year 2050."); 
    }
    return meets_day_req; 
     
}

/**
 * Checks if a given date is a future date. 
 */
function is_future_date(cmd_input){

    const today = new Date(); 
    let currentDay = today.getDate();
    let currentMonth = today.getMonth() + 1; // goes from 0 to 11
    let currentYear = today.getFullYear();


    date_info = cmd_input.substring(0, 8); // All of the data before the 'T', represents the date
    time_info = cmd_input.substring(9); // All of the data after the 'T', represents the time

    let year = parseInt(date_info.substring(0, 4)); 
    let month = parseInt(date_info.substring(4, 6)); 
    let day = parseInt(date_info.substring(6)); 


    if(year > currentYear){
        return true;
    } else if (year == currentYear){
        if (month > currentMonth){
            return true;
        } else if (month == currentMonth){
            if (day > currentDay){
                return true;
            }
        }
    }

    return false;
}


/**
 * Checks if any values in a given array are false. 
 */
function are_any_false(arr){
    for (let i = 0; i < arr.length; i++){
        if (arr[i] == false){
            return false; 
        }
    }

    return true; 
}

getFileName(); 

module.exports = { process_input };