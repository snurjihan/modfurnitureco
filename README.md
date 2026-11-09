# AI Analytics Prototype

An interactive AI-driven analytics prototype that processes dataset CSVs and leverages the Google Gemini API to generate insights. 

## Prerequisites
To run this project locally, you will need:
* [Node.js](https://nodejs.org/) or [Bun](https://bun.sh/) installed on your machine.
* A [Google Gemini API Key](https://aistudio.google.com/app/apikey).

## Dataset
* **customers_data.csv**: Contains unique customer ID linked to order IDs.
* **design_log.csv**: A tracking log of design phase containing the assigned designer, skill level, start and end dates and total duration in days.
* **financial_ledger.csv**: Financial record detailing transaction dates, types (e.g., COST, REVENUE), amounts, and descriptions (such as overheads or wages) to track cash flow.
* **hr_events_log.csv**: A timeline of employee-related events, recording dates, event types (e.g., Leave Start, Leave End, Resignation), the affected employee ID and additional details.
* **hr_roster.csv**: A directory of staffs listing their employee ID, role (designer, maker), skill level, employment status and hourly wage.
* **inventory_log.csv**: Material stock ledger showing when materials were reordered or consumed for specific orders, quantities involved and the updated inventory levels.
* **orders_data.csv**: A master list of orders, containing product type, production status, complexity, required hours across stages (design, milling, joinery, finishing), material costs, quoted prices, and key dates (creation, acceptance, completion and due dates).

## Getting Started

Follow these steps to run the prototype on your local machine:

**1. Clone the repository**
```
git clone [https://github.com/snurjihan/modfurnitureco.git](https://github.com/snurjihan/modfurnitureco.git)
cd modfurnitureco
```
**2. Install dependencies**
```
bun install
 # or npm install
```
**3. Set up environment variables**

GEMINI_API_KEY=your_gemini_API_KEY


````
