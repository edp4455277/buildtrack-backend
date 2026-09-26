const express = require('express');
const router = express.Router();

const pool = require('../config/db');

//  all projects
router.get('/', async (req, res) => {
    try {
        const [projects] = await pool.query(`
            SELECT
                p.Project_ID,
                p.Project_Name,
                p.Project_Description,
                p.Start_Date,
                p.Expected_End_Date,
                p.Actual_End_Date,
                p.Project_Status,
                p.Project_Budget,
                c.Client_ID,
                c.Client_Name,

                con.Contractor_ID,
                con.Contractor_Name,

                e.Employee_ID AS Project_Manager_ID,
                e.Employee_Name AS Project_Manager_Name

            FROM Projects p

            LEFT JOIN Clients c
                ON c.Client_ID = c.Client_ID

            LEFT JOIN Contractors con
                ON p.Contractor_ID = con.Contractor_ID

            LEFT JOIN Employees e
                ON p.Project_Manager_ID = e.Employee_ID

            ORDER BY p.Project_ID;
        `);

        res.json(projects);

    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

module.exports = router;