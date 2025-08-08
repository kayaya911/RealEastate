


function Get_Global_Variables() {
    return {
        Purchase_Type               : document.getElementById("HomeType").selectedIndex, // 0: PreSale,   1: Used Home
        Purchase_Date               : Date2PST_Conversion(document.getElementById("PurchaseDate").value),
        Purchase_Price              : parseFloat(document.getElementById("PurchasePrice").value),
        Purchase_Downpayment        : parseFloat(document.getElementById("Downpayment").value),
        Purchase_ClosingCost        : parseFloat(document.getElementById("ClosingCost").value),
        Purchase_PropertyTransferTax: NaN,
        Purchase_GST_2_Mortgage     : document.getElementById("5p_GST").checked,
        
        Mortgage_Amortization       : parseInt(document.getElementById("AmortizationYears").value),
        Mortgage_Annual_Rate        : parseFloat(document.getElementById("MortgageInterestRate").value),
        Mortgage_GST_Amount         : NaN,
        Mortgage_Total_Loan         : NaN,
        Mortgage_Monthly_Payment    : NaN,
        GST_Rate                    : parseFloat(document.getElementById("GST").value),
    
        Operating_Annual_Insurance              : parseFloat(document.getElementById("Insurance").value),
        Operating_Annual_Property_Tax           : parseFloat(document.getElementById("PropertyTax").value),
        Operating_Monthly_StrataFee             : parseFloat(document.getElementById("StrataFee").value),
        Operating_Monthly_UtilityFee            : parseFloat(document.getElementById("UtilityFee").value),
        Operating_Annual_RepairFee              : parseFloat(document.getElementById("AnnualRepairFee").value),
    
        Operating_Annual_Insurance_Increase     : parseFloat(document.getElementById("IncreaseInsurance").value),
        Operating_Annual_Property_Tax_Increase  : parseFloat(document.getElementById("IncreasePropertyTax").value),
        Operating_Monthly_StrataFee_Increase    : parseFloat(document.getElementById("IncreaseStrataFee").value),
        Operating_Monthly_UtilityFee_Increase   : parseFloat(document.getElementById("IncreaseUtilityFee").value),
        Operating_Annual_RepairFee_Increase     : parseFloat(document.getElementById("IncreaseRepairFee").value),
    
        Operating_Monthly_PropertyMangRate      : parseFloat(document.getElementById("PropertyMangRate").value),
        Operating_Annual_VacancyRate            : parseFloat(document.getElementById("VacancyRate").value),
        Operating_Monthly_RentalIncome          : parseFloat(document.getElementById("MonthlyRent").value),
        Operating_Monthly_OtherIncome           : parseFloat(document.getElementById("MonthlyOtherIncome").value),
    
        Operating_Monthly_RentalIncome_Increase : parseFloat(document.getElementById("IncreaseRental").value),
        Operating_Monthly_OtherIncome_Increase  : parseFloat(document.getElementById("IncreaseOther").value),
    
        Sale_Date               : Date2PST_Conversion(document.getElementById("SaleDate").value),
        Sale_Price              : parseFloat(document.getElementById("SalePrice").value),
        Sale_ClosingCost        : parseFloat(document.getElementById("SaleClosingCost").value),
        Sale_IncomeTaxBracket   : parseFloat(document.getElementById("IncomeTaxBracket").value),
        Sale_Capital_Gain_Tax   : NaN,
        Sale_Realtor_Fee        : NaN,

        AverageInflation        : parseFloat(document.getElementById("AverageInflation").value)
    }
}

// Assign Global Variables
let GV = Get_Global_Variables();
let Mortgage_LumpSum_Flag    = true;
let Mortgage_LumpSum_Payment = NaN;


function OnLoad() {
    Mortgage_LumpSum_Flag  = true;
    PurchaseType_Change();
    Calculate();
}
function Calculate() {
    // Update Global Variables
    GV = Get_Global_Variables();

    // Update Purchase Date and Sale Date
    Update_Dates();

    // Delete table
    DeleteTable();

    // Property Transfer Tax 
    // 1%  $0.00      to $200,000
    // 2%  $100,000   to $2,000,000
    // 3%  $2,000,000 to No limit 
    // 2%  above $3,000,000
    
    if (GV.Purchase_Price  <=  200000) { GV.Purchase_PropertyTransferTax = 0.01 * GV.Purchase_Price; } else { GV.Purchase_PropertyTransferTax = 2000; }
    if ((GV.Purchase_Price >  200000) && (GV.Purchase_Price <= 2000000)) { GV.Purchase_PropertyTransferTax += (0.02 * (GV.Purchase_Price - 200000)); } else { GV.Purchase_PropertyTransferTax += 36000; }
    if (GV.Purchase_Price  >  2000000) {GV.Purchase_PropertyTransferTax += 0.03 * (GV.Purchase_Price - 2000000); }
    if (GV.Purchase_Price  >  3000000) { GV.Purchase_PropertyTransferTax += 0.02 * (GV.Purchase_Price - 3000000); }
    document.getElementById("PropertyTransferTax").value     =  GV.Purchase_PropertyTransferTax.toFixed(2);

    // GST Amount
    GV.Mortgage_GST_Amount        = GV.Purchase_Price * GV.GST_Rate / 100;
    document.getElementById("5pGST_Cost").value     =  GV.Mortgage_GST_Amount.toFixed(2);

    // Total Mortgage Loan
    let Total_Mortgage_Loan = GV.Purchase_Price - GV.Purchase_Downpayment
    if ((GV.Purchase_Type == 0) && (GV.Purchase_GST_2_Mortgage)) { Total_Mortgage_Loan += GV.Purchase_Price*GV.GST_Rate/100 };  // Add GST to the proce of New Home only if Applicable
    GV.Mortgage_Total_Loan        = Total_Mortgage_Loan;
    document.getElementById("MortgageLoan").value   =  GV.Mortgage_Total_Loan .toFixed(2);

    // Mortgage Monthly Payment
    let P = GV.Mortgage_Total_Loan;
    let r = GV.Mortgage_Annual_Rate / 100 / 12;
    let n = GV.Mortgage_Amortization * 12;
    GV.Mortgage_Monthly_Payment = P * (r*Math.pow((1 + r),n)) / (Math.pow((1 + r),n) - 1);
    document.getElementById("MonthlyPayment").value =  GV.Mortgage_Monthly_Payment .toFixed(2);

    // Mortgage Lump-Sum Payments
    if (Mortgage_LumpSum_Flag) { Mortgage_LumpSum_Payment = new Array(n).fill(0); }

    // Mortgage Schedule
    Mortgage_Sch = MortgageSchedule(Mortgage_LumpSum_Payment);

    // Number of Months in Possession
    let Num_Months = GetMonths_Between(GV.Sale_Date, GV.Purchase_Date);

    // Create Master Tabel
    let MasterTable = new Array(n).fill().map(() => new Array(13).fill(0));
    
    // Payment Schedule for Income
    RentalIncome  = Monthly_Schedule(GV.Operating_Monthly_RentalIncome,     GV.Operating_Monthly_RentalIncome_Increase,  n);
    OtherIncome   = Monthly_Schedule(GV.Operating_Monthly_OtherIncome,      GV.Operating_Monthly_OtherIncome_Increase,   n);

    // Payment Schedule for Operating Cost
    StrataFee     = Monthly_Schedule(GV.Operating_Monthly_StrataFee,        GV.Operating_Monthly_StrataFee_Increase,     n);
    Insurance     = Monthly_Schedule(GV.Operating_Annual_Insurance/12,      GV.Operating_Annual_Insurance_Increase,      n);
    PropertyTax   = Monthly_Schedule(GV.Operating_Annual_Property_Tax/12,   GV.Operating_Annual_Property_Tax_Increase,   n);
    RepairAndFix  = Monthly_Schedule(GV.Operating_Annual_RepairFee/12,      GV.Operating_Annual_RepairFee_Increase,      n);
    UtilityFee    = Monthly_Schedule(GV.Operating_Monthly_UtilityFee,       GV.Operating_Monthly_UtilityFee_Increase,    n);
    VacancyFee    = Monthly_Schedule(GV.Operating_Monthly_RentalIncome*GV.Operating_Annual_VacancyRate/100,          GV.Operating_Monthly_RentalIncome_Increase,  n);
    MagementFee   = Monthly_Schedule((GV.Operating_Monthly_RentalIncome*GV.Operating_Monthly_PropertyMangRate/100)*(1+GV.GST_Rate/100),    GV.Operating_Monthly_RentalIncome_Increase,  n);
    
    // Clone the Purchase Date
    let CurrentDate = new Date( GV.Purchase_Date );

    // Zero
    let Total_MortgageInterest      = 0;
    let Total_MortgagePrincipal     = 0;
    let Total_StrataFee             = 0;
    let Total_InsuranceFee          = 0;
    let Total_PropertyMang          = 0;
    let Total_PropertyTax           = 0;
    let Total_Utility               = 0;
    let Total_Repair                = 0;
    let Total_Vacancy               = 0;
    let Total_InitialInvet          = 0;
    let Total_InitialInvet_Interest = 0;
    let Net_Profit                  = 0;

    // Initial Inverstment 
    Total_InitialInvet += (GV.Purchase_Downpayment + GV.Purchase_ClosingCost + GV.Purchase_PropertyTransferTax);
    if ((GV.Purchase_Type == 0) && (!GV.Purchase_GST_2_Mortgage)) { Total_InitialInvet += GV.Mortgage_GST_Amount; }
    Total_InitialInvet_Interest = (Total_InitialInvet * Num_Months * GV.AverageInflation / 100 / 12);

    for (let i=0; i<n; i++) {

        // Update Current Date
        CurrentDate.setMonth(CurrentDate.getMonth()+1);
        
        // Populate MasterTable
        MasterTable[i][0] = Formated_Date(CurrentDate);

        // Monthly Revenue
        MasterTable[i][1]  = RentalIncome[i];
        MasterTable[i][2]  = OtherIncome[i];

        Inc = RentalIncome[i] + OtherIncome[i];

        // Mortgage Payments
        MasterTable[i][3]  = Mortgage_Sch[i][0]; // Mortgage Interest
        MasterTable[i][4]  = Mortgage_Sch[i][1]; // Mortgage Principal

        // Monthly Expenses 
        MasterTable[i][5]  = MagementFee[i];
        MasterTable[i][6]  = StrataFee[i];
        MasterTable[i][7]  = Insurance[i];
        MasterTable[i][8]  = PropertyTax[i];
        MasterTable[i][9]  = UtilityFee[i];
        MasterTable[i][10] = RepairAndFix[i];
        MasterTable[i][11] = VacancyFee[i];

        Cos=0;
        for (let j=3; j<12; j++) { Cos+= MasterTable[i][j]; }

        // Cash Flow
        MasterTable[i][12] = Inc - Cos;

        Opt = (Math.floor(i / 12) % 2 === 0) ? true : false;

        ASD(i, MasterTable[i], Mortgage_LumpSum_Payment, Opt);
        
        if (GV.Sale_Date>=CurrentDate) {
            Total_MortgageInterest  += Mortgage_Sch[i][0];
            Total_MortgagePrincipal += Mortgage_Sch[i][1];
            Total_PropertyMang      += MagementFee[i];
            Total_StrataFee         += StrataFee[i];
            Total_InsuranceFee      += Insurance[i];
            Total_PropertyTax       += PropertyTax[i];
            Total_Utility           += UtilityFee[i];
            Total_Repair            += RepairAndFix[i];
            Total_Vacancy           += VacancyFee[i];

            if (MasterTable[i][12] < 0) {
                Total_InitialInvet          += Math.abs(MasterTable[i][12]);
                Total_InitialInvet_Interest += Math.abs(MasterTable[i][12]) * (GV.AverageInflation / 100 / 12) * (Num_Months - i);
            }
            else {
                Net_Profit += Math.abs(MasterTable[i][12]);
            }
            Total_InitialInvet_Interest  += Mortgage_LumpSum_Payment[i] * (GV.AverageInflation / 100 / 12) * (Num_Months - i);
        }

    }

    // Realtor_Fee
    if (document.getElementById("RealtorFee_Chk").checked) {
        GV.Sale_Realtor_Fee = (7000 + (GV.Sale_Price-100000)*0.025)*(1+GV.GST_Rate/100);
        document.getElementById("RealtorFee").value  = GV.Sale_Realtor_Fee.toFixed(2);
    }
    else {
        GV.Sale_Realtor_Fee = parseFloat(document.getElementById("RealtorFee").value);
    }

    // Capital Gain Tax
    GV.Sale_Capital_Gain_Tax = ((GV.Sale_Price - GV.Purchase_Price)/2)*GV.Sale_IncomeTaxBracket/100;
    document.getElementById("CapitalGainTax").value  = GV.Sale_Capital_Gain_Tax.toFixed(2);

    document.getElementById("TotalMortgageInterest").value  = Total_MortgageInterest.toFixed(2);
    document.getElementById("TotalMortgagePrincipal").value = Total_MortgagePrincipal.toFixed(2);
    document.getElementById("TotalPropoertyMang").value     = Total_PropertyMang.toFixed(2);
    document.getElementById("TotalStrataFee").value         = Total_StrataFee.toFixed(2);
    document.getElementById("TotalInsurance").value         = Total_InsuranceFee.toFixed(2);
    document.getElementById("TotalPropertyTax").value       = Total_PropertyTax.toFixed(2);
    document.getElementById("TotalUtility").value           = Total_Utility.toFixed(2);
    document.getElementById("TotalRepair").value            = Total_Repair.toFixed(2);
    document.getElementById("TotalVacancy").value           = Total_Vacancy.toFixed(2);

    // Return of Investment Calculations

    // Sale Cost
    Total_Salecost = GV.Sale_Realtor_Fee + GV.Sale_Capital_Gain_Tax + GV.Sale_ClosingCost;

    // Mortgage Balance
    MortgageBalance = Total_Mortgage_Loan  -  Total_MortgagePrincipal;

    // Net Profit
    Net_Profit += (GV.Sale_Price - MortgageBalance - Total_InitialInvet - Total_Salecost);
    
    // Return of Investment 
    ROI = Net_Profit / Total_InitialInvet * 100;

    document.getElementById("InitialInvetment").value    = Total_InitialInvet.toFixed(2);
    document.getElementById("NetProfit").value           = Net_Profit.toFixed(2);
    document.getElementById("MortgageBalance").value     = MortgageBalance.toFixed(2);
    document.getElementById("ROI").value                 = ROI.toFixed(2);
    document.getElementById("SalePrice_Text").innerHTML  = "Sale Price (%" +  ((ROI/Num_Months) *12).toFixed(2) +")"
    document.getElementById("TotalInterestLoss").value   = Total_InitialInvet_Interest.toFixed(2); 
    
    
    // Net Profit - color update
    if ((Net_Profit < 0) || (Net_Profit < Total_InitialInvet_Interest)){
        document.getElementById("NetProfit").style.color = "red";
        document.getElementById("ROI").style.color       = "red";
        document.getElementById("Message").style.color   = "red";
        document.getElementById("Message").textContent   = "The Interest earned on the Total Investment exceeds the Business Net Profit. LOSS !!";
    }
    else {
        document.getElementById("NetProfit").style.color = "green";
        document.getElementById("ROI").style.color       = "green";
        document.getElementById("Message").style.color   = "green";
        document.getElementById("Message").textContent   = "The Business Net Profit exceeds the Interest Earned on the Total Investment.";
        
    }

}
function Interest_Calculation(P, r, n, Opt) {
    // P : Principal
    // r : Annual Interest Rate
    // n : Number of Months
    if (Opt) {
        // Simple Interest
        return P*(1+r*(n/12))
    }
    else {
        // Montly Compound Interest
        return P*(1+(r/12))**(12*n/12)
    }
}
function Format_TwoDecimals(input) {
    // Get current cursor position and input value
    let cursorPos = input.selectionStart;
    let originalValue = input.value;
    let container = input.parentElement;
    
    // Clean input: allow numbers, decimal point, and minus sign
    let cleanedValue = originalValue.replace(/[^0-9.-]/g, '');
    
    // Handle empty input or just minus sign
    if (cleanedValue === '' || cleanedValue === '-') {
      input.value = cleanedValue;
      container.classList.toggle('negative', cleanedValue === '-');
      input.classList.toggle('negative', cleanedValue === '-');
      return;
    }
    
    // Parse number
    let num = parseFloat(cleanedValue);
    if (isNaN(num)) {
      input.value = '';
      container.classList.remove('negative');
      input.classList.remove('negative');
      return;
    }
    
    // Format number with 2 decimal places and commas
    let formatted = num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    // Update negative class based on input
    let isNegative = cleanedValue.startsWith('-') && num > 0;
    container.classList.toggle('negative', isNegative);
    input.classList.toggle('negative', isNegative);
    
    // Update input value (exclude $)
    input.value = formatted;
    
    // Calculate new cursor position
    let newCursorPos = cursorPos;
    
    // Count commas before cursor in original and formatted values
    let commasBeforeCursor = (originalValue.slice(0, cursorPos).match(/,/g) || []).length;
    let newCommasBeforeCursor = (formatted.slice(0, newCursorPos).match(/,/g) || []).length;
    newCursorPos += (newCommasBeforeCursor - commasBeforeCursor);
    
    // Adjust for negative sign in value
    if (isNegative && !originalValue.startsWith('-')) {
      newCursorPos += 1; // Account for - in cursor positioning
    }
    
    // Ensure cursor doesn't jump past decimal or end
    let decimalIndex = formatted.indexOf('.');
    if (decimalIndex !== -1 && newCursorPos > decimalIndex) {
      newCursorPos = Math.min(newCursorPos, formatted.length);
    }
    
    // Set cursor position
    try {
      input.setSelectionRange(newCursorPos, newCursorPos);
    } catch (e) {
      input.selectionStart = input.selectionEnd = newCursorPos;
    }
}
function UpdateLumpSumPayments(a) {
    
    aa = "LumpSum-" + a.toString();

    Mortgage_LumpSum_Flag = false;

    Mortgage_LumpSum_Payment[a] = parseFloat(document.getElementById(aa).value);

    Calculate();
}
function Realtor_Chance() {
    // Update Sale Details
    if (document.getElementById("RealtorFee_Chk").checked) {
        GV.Sale_Realtor_Fee = (7000 + (GV.Sale_Price-100000)*0.025)*(1+GV.GST_Rate/100);
        document.getElementById("RealtorFee").value  = GV.Sale_Realtor_Fee.toFixed(2);
        document.getElementById("RealtorFee").disabled = true;
    }
    else {
        document.getElementById("RealtorFee").disabled = false;
    }
    Calculate();
}
function DeleteTable() {
    // Clear RecordsTable
    table = document.getElementById("PaymentTable");
    numOfRows = table.rows.length;
    for (i=1; i<numOfRows-1; i++) { table.deleteRow(1); }        // delete all rows except the header and the last row
    row = table.insertRow(-1);                                   // add one empty raw to the end of the list
    row.setAttribute('class', 'Outputs-Records-Table-body-tr');
    table.deleteRow(1);                                          // delete the first row from the table
}
function MortgageSchedule(LS) {
    let P  = GV.Mortgage_Total_Loan;
    let r  = GV.Mortgage_Annual_Rate / 100 / 12;
    let n  = GV.Mortgage_Amortization * 12;

    let MontlyPayment = P * (r*Math.pow((1 + r),n)) / (Math.pow((1 + r),n) - 1);

    // Mortgage Schedule
    let Sch = new Array(n).fill().map(() => new Array(3).fill(0));
    let Balance = P;
    
    for (let i=0; i<n; i++) {
        if (Balance<=0) { Balance = 0; }
        Sch[i][0]  = Balance * r;                                                   // Interest payment 
        Sch[i][1]  = Math.min(Balance + Sch[i][0],  MontlyPayment - Sch[i][0]);     // Principal payment 
        Balance   -= (Sch[i][1] + LS[i]);                                           // Balance 
    }
    return Sch;
}
function Monthly_Schedule(P, r, Num_Months) {

    // Counter
    let ii = 1;

    // Payment Schedule
    let Sch = new Array(Num_Months).fill();

    // Loop over each mayment month
    for (let i = 0; i < Num_Months; i++) {

        // Cjech if it is more than 12 months (1 year)
        if (ii>12) { P = P*(1+r/100); ii=1;}

        // Payment 
        Sch[i] = P;

        // Update Counter
        ii++;
    }
    return Sch;
}
function Update_Dates() {
    // Update Global Variables
    let GV = Get_Global_Variables();

    // Update Purchase Date and Sale Date
    let Sale_date     = new Date(GV.Sale_Date);
    let Purchase_date = new Date(GV.Purchase_Date);

    // Get year, month, and day
    let year  = Sale_date.getUTCFullYear();
    let month = String(Sale_date.getUTCMonth() + 1).padStart(2, '0'); // Months are 0-based, so +1
    let day   = String(Sale_date.getUTCDate()).padStart(2, '0');

    // Format as yyyy-mm-dd
    let Sale_Date = `${year}-${month}-${day}`;

    // Get year, month, and day
    year  = Purchase_date.getUTCFullYear();
    month = String(Purchase_date.getUTCMonth() + 1).padStart(2, '0'); // Months are 0-based, so +1
    day   = String(Purchase_date.getUTCDate()).padStart(2, '0');

    // Format as yyyy-mm-dd
    Purchase_date = `${year}-${month}-${day}`;
    
    document.getElementById("SaleDate").value     = Sale_Date;
    document.getElementById("PurchaseDate").value = Purchase_date;

}
function Date2PST_Conversion(Date_String) {
    return date = new Date(Date_String +  "T00:00:00-08:00");
}
function Formated_Date(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function GetMonths_Between(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const months = (d2.getUTCFullYear() - d1.getUTCFullYear()) * 12 + (d2.getUTCMonth() - d1.getUTCMonth());
    return Math.abs(months);
}
function ASD(No, MasterTable, MLSP, Opt) {

    // Number of row and columns
    table1    = document.getElementById('PaymentTable');
    numOfRows = table1.rows.length;
    numOfCols = table1.rows[0].cells.length;

    if (table1.tBodies[0].children[0].children[0] == undefined) {
        // The first row of the table-body is empty
        // Use the empty row  
        row = table1.tBodies[0].children[0];
        numOfRows--;
    } else {
        // The first row of the table-body is not empty
        // Insert a row at the end of the table-body
        row = table1.insertRow(-1);
    }

    // Assign class to the row
    if (Opt) {
        row.setAttribute('class', 'Outputs-Records-Table-body-tr');
    }
    else {
        row.setAttribute('class', 'Outputs-Records-Table-body-tr_2');
    }
    // 1st column (No) --------------------------------------------
    i = 0;
    cell = row.insertCell(i);
    cell.setAttribute('class', 'Outputs-Records-Table-body-td');
    cell.innerHTML = No+1;

    // 2nd column (Payment Date) --------------------------------------------
    i = 1;
    cell = row.insertCell(i);
    cell.setAttribute('class', 'Outputs-Records-Table-body-td');
    cell.innerHTML = MasterTable[0];

    // 3rd column (Rental Income) --------------------------------------------
    i = 2;
    cell = row.insertCell(i);
    cell.setAttribute('class', 'Outputs-Records-Table-body-td');
    cell.innerHTML = "$ " +  MasterTable[1].toFixed(2);

    // 4th column (Other Income) --------------------------------------------
    i = 3;
    cell = row.insertCell(i);
    cell.setAttribute('class', 'Outputs-Records-Table-body-td');
    cell.innerHTML = "$ " +  MasterTable[2].toFixed(2);

    // 5th column (Mortgage Interest) --------------------------------------------
    i = 4;
    cell = row.insertCell(i);
    cell.setAttribute('class', 'Outputs-Records-Table-body-td');
    cell.innerHTML = "$ " +  MasterTable[3].toFixed(2);

    // 6th column (Mortgage Principal) --------------------------------------------
    i = 5;
    cell = row.insertCell(i);
    cell.setAttribute('class', 'Outputs-Records-Table-body-td');
    cell.innerHTML = "$ " +  MasterTable[4].toFixed(2);

    // 7th column (Lump Sum Payment) --------------------------------------------
    i = 6;
    cell = row.insertCell(i);
    cell.setAttribute('class', 'Outputs-Records-Table-body-td');
    
    divv            = document.createElement('div');
    divv.setAttribute('class', 'dollar-input_2');
    cell.appendChild(divv);

    spann            = document.createElement('span');
    spann.textContent      = "$";
    spann.setAttribute('class', 'dollar-symbol_3');
    divv.appendChild(spann);

    input           = document.createElement('input');
    input.title     = "Lumpsum Payment";
    input.type      = "number";
    input.value     = MLSP[No];
    input.step      = 100;
    input.min       = 0;
    input.id        = 'LumpSum-' + (numOfRows-1).toString();
    input.setAttribute('onchange', "UpdateLumpSumPayments(" + (numOfRows-1).toString() + ")" );
    input.setAttribute('class', 'Currency_Input_3');
    divv.appendChild(input);


    // 8th column (Management Fee) --------------------------------------------
    i = 7;
    cell = row.insertCell(i);
    cell.setAttribute('class', 'Outputs-Records-Table-body-td');
    cell.innerHTML = "$ " +  MasterTable[5].toFixed(2);

    // 9th column (Starata Fee) --------------------------------------------
    i = 8;
    cell = row.insertCell(i);
    cell.setAttribute('class', 'Outputs-Records-Table-body-td');
    cell.innerHTML = "$ " +  MasterTable[6].toFixed(2);

    // 10th column (Insurance Fee) --------------------------------------------
    i = 9;
    cell = row.insertCell(i);
    cell.setAttribute('class', 'Outputs-Records-Table-body-td');
    cell.innerHTML = "$ " +  MasterTable[7].toFixed(2);

    // 11th column (Property Tax) --------------------------------------------
    i = 10;
    cell = row.insertCell(i);
    cell.setAttribute('class', 'Outputs-Records-Table-body-td');
    cell.innerHTML = "$ " +  MasterTable[8].toFixed(2);

    // 10th column (Utility Fee) --------------------------------------------
    i = 11;
    cell = row.insertCell(i);
    cell.setAttribute('class', 'Outputs-Records-Table-body-td');
    cell.innerHTML = "$ " +  MasterTable[9].toFixed(2);

    // 11th column (Repair and Fix) --------------------------------------------
    i = 12;
    cell = row.insertCell(i);
    cell.setAttribute('class', 'Outputs-Records-Table-body-td');
    cell.innerHTML = "$ " +  MasterTable[10].toFixed(2);

    // 12th column (Vacancy) --------------------------------------------
    i = 13;
    cell = row.insertCell(i);
    cell.setAttribute('class', 'Outputs-Records-Table-body-td');
    cell.innerHTML = "$ " +  MasterTable[11].toFixed(2);

    // 13th column (Cash Flow) --------------------------------------------
    i = 14;
    cell = row.insertCell(i);
    cell.setAttribute('class', 'Outputs-Records-Table-body-td');
    cell.innerHTML = "$ " +  MasterTable[12].toFixed(2);

}
//-------------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------



//-------------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------
function PurchaseType_Change() {

    let Home_Type     = document.getElementById("HomeType").selectedIndex; // 0: PreSale,   1: Used Home
    let PurchaseTable = document.getElementById('PurchaseTable');
    
    GV.Purchase_Type = Home_Type;

    if (Home_Type == 0) { 
        PurchaseTable.rows[5].style.display = "table-row";
        PurchaseTable.rows[7].style.display = "table-row";
    }
    else if (Home_Type == 1) { 
        PurchaseTable.rows[5].style.display = "none";
        PurchaseTable.rows[7].style.display = "none"; 
    }
    
    // Re-Calculate
    Calculate();
}
//-------------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------
// Vertical resizer
const verticalResizer  = document.getElementById('resizer-vertical');
const treeMenu         = document.getElementById('tree-manu');
let isResizingVertical = false;

// Horizontal resizer
const horizontalResizer   = document.getElementById('resizer-horizontal-top');
const resultsParameters   = document.getElementById('results-parameters');   
let isResizingHorizontal = false;

horizontalResizer.addEventListener('mousedown', (e) => {
    isResizingHorizontal = true;
    document.addEventListener('mousemove', resizeHorizontal);
    document.addEventListener('mouseup', stopResizeHorizontal);
});

function resizeHorizontal(e) {
    if (!isResizingHorizontal) return;
    const resultsMenu = document.querySelector('.results-menu');
    const newHeight = e.clientY - resultsMenu.offsetTop;
    if (newHeight > 100 && newHeight < resultsMenu.offsetHeight - 100) {
        resultsParameters.style.flex = `0 0 ${newHeight}px`;
    }
}

function stopResizeHorizontal() {
    isResizingHorizontal = false;
    document.removeEventListener('mousemove', resizeHorizontal);
    document.removeEventListener('mouseup', stopResizeHorizontal);
}


