const cron = require('node-cron');
const { BorrowingRecords, Fines, FineTypes, Members, sequelize } = require('../models');
const { Op } = require('sequelize');

// Runs daily at 00:05 to compute overdue fines
const schedule = () => {
  cron.schedule('5 0 * * *', async () => {
    try {
      const now = new Date();
      const overdueType = await FineTypes.findOne({ where: { TypeName: 'Overdue' } });
      const rows = await BorrowingRecords.findAll({ where: { DueDate: { [Op.lt]: now }, Status: { [Op.ne]: 'Returned' } } });
      for (const r of rows) {
        const days = Math.ceil((now - new Date(r.DueDate)) / (1000 * 60 * 60 * 24));
        const base = overdueType ? parseFloat(overdueType.BaseAmount) : 0;
        const amount = days * base;
        // create or update fine for this borrow
        const existing = await Fines.findOne({ where: { BorrowID: r.BorrowID } });
        if (existing) {
          await existing.update({ Amount: amount, IssuedDate: new Date(), FineStatus: 'Unpaid' });
        } else {
          // find member to get UserID
          const member = await Members.findOne({ where: { MemberID: r.MemberID } });
          if (member) {
            await Fines.create({ UserID: member.UserID, TypeID: overdueType ? overdueType.TypeID : null, BorrowID: r.BorrowID, Amount: amount, IssuedDate: new Date(), FineStatus: 'Unpaid' });
          }
        }
      }
    } catch (err) {
      console.error('Fine job failed', err);
    }
  });
};

module.exports = { schedule };
