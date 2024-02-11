# ECE452: Software Engineering Assignment 3
#### Deshna Doshi, dd1035, 206009273
### Algorithm Design Description: 

1. Users must enter the name of the file (.txt extensions only) in the command line when prompted. Files must be in the same directory are the Assignment 3 Folder. Files not in this directory will not be recorgnized/processed. 

2. The program runs in a loop. Users will be asked to enter the file name continually after sorting, until they enter 'Q' or 'q'. 


#### Valid vs. Invalid File Constraints
1. Whitespace is not permitted in the files. For example, 'ATTENDEE   :hello@gmail.com' will be considered invalid. 

2. iCalendar properties and values are not case sensitive, besides the letter 'T' in the TIME property. 

3. Only 10 digit phone numbers are accepted. Phone number may be separated by dashes, or not separated at all. 

4. DTSTART values, or time of operation of the doctor's office, are between 9 AM and 3 PM (09:00 and 15:00) on all days except Sundays. Only future dates are allowed. Today's date is not allowed. 