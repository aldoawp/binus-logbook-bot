# BINUS Logbook Bot 🤖

An automated bot that streamlines the process of submitting monthly student internship activity data to the BINUS University LMS. This bot reads activity data from an Excel file and automatically fills out the logbook entries, saving you hours of manual data entry.

### ✨ Key Features

- 🚀 **Automated Data Entry**: Fills out logbook entries automatically
- 📊 **Excel Integration**: Reads data directly from Excel files
- 🗓️ **Smart OFF Day Detection**: Automatically handles days marked as "OFF"
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

This will install all required packages for the bot to work.

#### 3. Configure Your Credentials

Create a `.env` file in the project root directory:

```bash
# Copy the example file (if available)
cp env.example .env

# Or create a new .env file manually
```

Add your BINUS credentials to the `.env` file:

```env
BINUS_EMAIL=your.email@binus.ac.id
BINUS_PASSWORD=your_password
CLOCK_IN_TIME=08:00
CLOCK_OUT_TIME=17:00
MONTHLY_LOG=SEPTEMBER
SEMESTER=ODD
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

| Variable | Description | Example |
|----------|-------------|---------|
| `BINUS_EMAIL` | Your BINUS email address | `john.doe@binus.ac.id` |
| `BINUS_PASSWORD` | Your BINUS password | `your_password` |
| `CLOCK_IN_TIME` | Default clock-in time | `08:00` |
| `CLOCK_OUT_TIME` | Default clock-out time | `17:00` |

### Excel File Configuration

The bot expects your Excel file to have:
- **Header row**: Can be skipped (the bot starts from row 2)
- **Column B**: Activity name
- **Column C**: Activity description
- **OFF days**: Mark with "OFF" in either Activity or Description column

## 🛠️ Troubleshooting

### Common Issues

**Q: The bot can't find my Excel file**
- Make sure the file is named `monthly_activity.xlsx` and is in the `src/data/` folder
- Check that the file is not open in Excel while running the bot

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

This project is licensed under the ISC License.

## 🤝 Contributing

Contributions are welcome! If you find a bug or have a feature request, please open an issue or submit a pull request.

## ⚠️ Disclaimer

This bot is for educational and productivity purposes. Use it responsibly and in accordance with your university's policies. The authors are not responsible for any misuse of this tool.

---

**Happy Automating! 🚀**

*Save time, focus on learning, let the bot handle the paperwork.*