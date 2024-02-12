const { process_input } = require('../../appointment');
const fs = require('fs');

describe ('VEVENT Verifier', () => {
    // Test Case 1: A correctly formatted iCalendar file should be verified. 
    it ('should verify a correctly formatted VEVENT in the iCalendar file.', async () => {
        const result = await process_input("test1.txt"); 
        expect(result).toBe(true); 

    }); 

    // Test Case 2: iCalendar missing required properties should not be verified. 
    it ('should not verify an iCalendar missing required properties.', async () => {
        const result = await process_input("test2.txt"); 
        expect(result).toBe(false); 
    }); 

    // Test Case 3: Files with no VEVENT components should not be verified. 
    it ('should not verify an iCalendar without a VEVENT component.', async () => {
        const result = await process_input("test3.txt"); 
        expect(result).toBe(false); 
    }); 

    // Test Case 4: Files missing required VEVENT components should not be verified. 
    it ('should not verify an iCalendar without a VEVENT component.', async () => {
        const result = await process_input("test4.txt"); 
        expect(result).toBe(false); 
    }); 

    // Test Case 5: Files with an erroneous ATTENDEE value should not be verified. 
    it ('should not verify a VEVENT with an incorrect ATTENDEE value.', async () => {
        const result = await process_input("test5.txt"); 
        expect(result).toBe(false); 
    });

    // Test Case 6: Files with an erroneous STATUS value should not be verified. 
    it ('should not verify a VEVENT with an incorrect STATUS value.', async () => {
        const result = await process_input("test6.txt"); 
        expect(result).toBe(false); 
    });

    // Test Case 7: Files with an erroneous METHOD value should not be verified. 
    it ('should not verify a VEVENT with an incorrect METHOD value.', async () => {
        const result = await process_input("test7.txt"); 
        expect(result).toBe(false); 
    });

    // Test Case 8: Files with an erroneous DTSTAMP value should not be verified. 
    it ('should not verify a VEVENT with an incorrect DTSTAMP value.', async () => {
        const result = await process_input("test8.txt"); 
        expect(result).toBe(false); 
    });

    // Test Case 9: Files with an DTSTART value that is not in the future (after today) should not be verified. 
    it ('should not verify a VEVENT with an invalid DTSTART value.', async () => {
        const result = await process_input("test9.txt"); 
        expect(result).toBe(false); 
    });

    // Test Case 10: Files with an DTSTART value in the future be verified. 
    it ('should verify a VEVENT with an DTSTART value in the future.', async () => {
        const result = await process_input("test10.txt"); 
        expect(result).toBe(true); 
    });

    // Test Case 11: Files with an optional components should be verified. 
    it ('should verify a VEVENT with an optional components.', async () => {
        const result = await process_input("test11.txt"); 
        expect(result).toBe(true); 
    }); 

    // Test Case 12: Files with an unknown components should not be verified. 
    it ('should not verify a VEVENT with an unknown components.', async () => {
        const result = await process_input("test12.txt"); 
        expect(result).toBe(false); 
    }); 

    // Test Case 13: Files with VEVENT components containing more than one property per line should not be verified.
    it ('should not verify a VEVENT with more than one property per line.', async () => {
        const result = await process_input("test13.txt"); 
        expect(result).toBe(false); 
    }); 


    // Test Case 14: Files containing whitespace, with correct information should be verified.
    it ('should verify correct VEVENT records with whitespace.', async () => {
        const result = await process_input("test14.txt"); 
        expect(result).toBe(true); 
    }); 

    // Test Case 15: VEVENT components with a DTSTART value later than 3 PM and before 9AM should not be verified.
    it ('should not verify components with a DTSTART value later than 3 PM and before 9AM.', async () => {
        const result = await process_input("test15.txt"); 
        expect(result).toBe(false); 
    }); 

    // Test Case 16: VEVENT components with a DTSTART value that falls on a Sunday should not be verified.
    it ('should not verify components with a DTSTART value that falls on a Sunday.', async () => {
        const result = await process_input("test16.txt"); 
        expect(result).toBe(false); 
    });

    // Test Case 17: VEVENT components with a ATTENDEE phone number that contains dashes, should be verified.
    it ('should verify components with a ATTENDEE phone number that contains dashes.', async () => {
        const result = await process_input("test17.txt"); 
        expect(result).toBe(true); 
    });

    // Test Case 18: Two or more VEVENT components may not have the same DTSTART values, and these records should not be verified. 
    it ('should not verify components with a same day DTSTART values.', async () => {
        const result = await process_input("test18.txt"); 
        expect(result).toBe(false); 
    });

    // Test Case 19: DTSTAMP values must be before DTSTART values. 
    it ('should not verify components with a DTSTART value that occurs before DTSTAMP.', async () => {
        const result = await process_input("test19.txt"); 
        expect(result).toBe(false); 
    });

    // Test Case 20: You cannot schedule an appointment beyond the year 2050. 
    it ('should not verify components with a DTSTART value that is beyond 2050.', async () => {
        const result = await process_input("test20.txt"); 
        expect(result).toBe(false); 
    });

})