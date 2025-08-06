const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const express = require('express');

const GetUsers = async (req, res) => {
    const users = await prisma.users.findMany({
        select: {
          employee_id: true,
          prefix: {
            select: {
              name: true 
            }
          },
          first_name: true,
          last_name: true,
          username: true,
          role: {
            select: {
              role_name: true 
            }
          },
          last_login: true,
          updated_at: true,
        },
      });
      res.json(users);
}

module.exports = {
    GetUsers
};