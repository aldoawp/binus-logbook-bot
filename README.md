# BINUS Logbook Bot 🤖

An automated bot that streamlines the process of submitting monthly student internship activity data to the BINUS University LMS. This bot reads activity data from an Excel file and automatically fills out the logbook entries, saving you hours of manual data entry.

### ✨ Key Features

- 🚀 **Automated Data Entry**: Fills out logbook entries automatically
- 📊 **Excel Integration**: Reads data directly from Excel files
- 🗓️ **Smart OFF Day Detection**: Automatically handles days marked as "OFF"
- ⚙️ **Flexible Configuration**: Customize month, semester, clock times, and Excel file path
- 🔒 **Secure**: Your credentials are stored locally and never shared
- ⚡ **Fast**: Processes multiple entries in minutes instead of hours
- 🛡️ **Error Handling**: Robust error handling with detailed logging

## 🚀 Quick Start

### Prerequisites

Before you begin, make sure you have:

- **Node.js** (version 16 or higher) - [Download here](https://nodejs.org/)
- **BINUS University credentials** (email and password)
- **Excel file** with your monthly activity data

### Step-by-Step Setup

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd logbook_bot
```

#### 2. Install Dependencies

Open your terminal/command prompt in the project folder and run:

```bash
npm install
```

Wait until the complete, then run this:

```bash
npx playwright install
```

This will install all required packages for the bot to work.

#### 3. Configure Your Credentials

Create a `.env` file in the project root directory:

```bash
# Copy the example file (if available)
cp env.example .env

# Or create a new .env file manually
```

Add your BINUS credentials and configuration to the `.env` file:

```env
# Login credentials
EMAIL=your.email@binus.ac.id
PASSWORD=your_password

# Clock in and out times (12-hour format: HH:MM am or pm)
CLOCK_IN_TIME="08:00 am"
CLOCK_OUT_TIME="05:00 pm"

# Logbook month (use month abbreviation)
# EVEN semester months: FEB, MAR, APR, MAY, JUN, JUL, AUG
# ODD semester months: SEP, OCT, NOV, DEC, JAN, FEB
LOGBOOK_MONTH=SEP

# Internship semester (EVEN or ODD)
# EVEN: 2420, ODD: 2510
INTERNSHIP_SEMESTER=ODD

# Excel file path
EXCEL_FILE_PATH=./src/data/monthly_activity.xlsx
```

> ⚠️ **Security Note**: Your credentials are stored locally on your machine and are never shared or uploaded anywhere.

#### 4. Prepare Your Excel Data

Navigate to the `src/data/` folder and modify the `monthly_activity.xlsx` file:

**Excel File Structure:**
- **Column A**: Date (optional, for reference)
- **Column B**: Activity (required)
- **Column C**: Description (required)

**Example Excel Data:**
| Date | Activity | Description |
|------|----------|-------------|
| 2025-01-01 | OFF | OFF |
| 2025-01-02 | Project Development | Working on frontend components |
| 2025-01-03 | Database Design | Creating database schema |
| 2025-01-04 | OFF | OFF |
| 2025-01-05 | Code Review | Reviewing team member's code |

**Important Notes:**
- For OFF days, put "OFF" in either the Activity or Description column
- Make sure all required fields are filled
- The bot will process rows in order from top to bottom

#### 5. Run the Bot

Start the bot by running:

```bash
npm start
```

The bot will:
1. 🔐 Log into your BINUS account
2. 🧭 Navigate to the activity logbook section
3. 📊 Read your Excel data
4. 📝 Fill out each day's activities automatically
5. ✅ Submit all entries

## 📁 Project Structure

```
logbook_bot/
├── src/
│   ├── core/           # Core bot functionality
│   │   ├── bot.ts      # Main bot logic
│   │   └── login.ts    # Login automation
│   ├── constant/       # Configuration files
│   │   ├── locator.ts  # Web element selectors
│   │   └── url.ts      # URL constants
│   ├── data/           # Data files
│   │   └── monthly_activity.xlsx  # Your activity data
│   ├── types/          # TypeScript type definitions
│   └── main.ts         # Application entry point
├── specs/              # Documentation
├── package.json        # Project dependencies
└── README.md          # This file
```

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Example | Options |
|----------|-------------|---------|---------|
| `EMAIL` | Your BINUS email address | `john.doe@binus.ac.id` | - |
| `PASSWORD` | Your BINUS password | `your_password` | - |
| `CLOCK_IN_TIME` | Clock-in time (12-hour format) | `"08:00 am"` | Any valid time |
| `CLOCK_OUT_TIME` | Clock-out time (12-hour format) | `"05:00 pm"` | Any valid time |
| `LOGBOOK_MONTH` | Month for logbook entries | `SEP` | FEB, MAR, APR, MAY, JUN, JUL, AUG, SEP, OCT, NOV, DEC, JAN |
| `INTERNSHIP_SEMESTER` | Semester type | `ODD` | EVEN, ODD |
| `EXCEL_FILE_PATH` | Path to your Excel file | `./src/data/monthly_activity.xlsx` | Any valid file path |

### Month and Semester Configuration

The bot supports flexible month and semester configuration:

**Month Options:**
- **EVEN Semester**: FEB, MAR, APR, MAY, JUN, JUL, AUG
- **ODD Semester**: SEP, OCT, NOV, DEC, JAN, FEB

**Semester Options:**
- **EVEN**: Maps to semester code 2420
- **ODD**: Maps to semester code 2510

**Examples:**
```env
# For September (ODD semester)
LOGBOOK_MONTH=SEP
INTERNSHIP_SEMESTER=ODD

# For February (can be either semester)
LOGBOOK_MONTH=FEB
INTERNSHIP_SEMESTER=EVEN  # or ODD
```

### Excel File Configuration

The bot expects your Excel file to have:
- **Header row**: Can be skipped (the bot starts from row 2)
- **Column B**: Activity name
- **Column C**: Activity description
- **OFF days**: Mark with "OFF" in either Activity or Description column

**Custom Excel File Path:**
You can specify a custom path to your Excel file using the `EXCEL_FILE_PATH` environment variable:
```env
EXCEL_FILE_PATH=./path/to/your/custom_activity.xlsx
```

## 🛠️ Troubleshooting

### Common Issues

**Q: The bot can't find my Excel file**
- Check the `EXCEL_FILE_PATH` in your `.env` file
- Make sure the file path is correct and the file exists
- Check that the file is not open in Excel while running the bot
- Default path is `./src/data/monthly_activity.xlsx`

**Q: Login failed**
- Verify your credentials in the `.env` file
- Make sure you're using your BINUS email and password
- Check if your BINUS account requires 2FA (not currently supported)

**Q: The bot stops at a specific row**
- Check the console output for error messages
- Verify that the Excel data for that row is properly formatted
- Ensure the LMS page has loaded completely

**Q: OFF days are not being handled correctly**
- Make sure "OFF" is written exactly as "OFF" (case-sensitive)
- Check that it's in either the Activity or Description column

**Q: Wrong month or semester is being used**
- Check your `LOGBOOK_MONTH` setting (use month abbreviation like SEP, OCT, etc.)
- Verify your `INTERNSHIP_SEMESTER` setting (EVEN or ODD)
- Make sure the month matches the semester (EVEN: FEB-AUG, ODD: SEP-JAN)

**Q: Clock times are not working correctly**
- Use 12-hour format with am/pm (e.g., "08:00 am", "05:00 pm")
- Make sure to include quotes around the time values
- Check that the format matches exactly: "HH:MM am/pm"

### Getting Help

If you encounter issues:

1. **Check the console output** for detailed error messages
2. **Verify your Excel data** is properly formatted
3. **Ensure your credentials** are correct
4. **Check your internet connection** and BINUS LMS accessibility

## 🔒 Security & Privacy

- ✅ **Local Storage**: All data stays on your computer
- ✅ **No Data Sharing**: Your credentials are never transmitted to external servers
- ✅ **Secure Login**: Uses the same login process as manual access
- ✅ **Temporary Files**: Any temporary files are cleaned up automatically

## 📝 License

This project is licensed under the Freeware License.

## 🤝 Contributing

Contributions are welcome! If you find a bug or have a feature request, please open an issue or submit a pull request.

## ⚠️ Disclaimer

This bot is for educational and productivity purposes. Use it responsibly and in accordance with your university's policies. The authors are not responsible for any misuse of this tool.

---

**Happy Automating! 🚀**

*Save time, focus on learning, let the bot handle the paperwork.*
