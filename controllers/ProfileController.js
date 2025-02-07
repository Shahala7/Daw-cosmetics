const User = require("../models/userSchema")
const Product = require("../models/productSchema")
const Address = require("../models/addressSchema")
const Order = require("../models/orderSchema")
const nodemailer = require("nodemailer")
const bcrypt = require("bcryptjs")


const getUserProfile = async (req, res) => {
    try {
        
        const userId = req.session.user
        const userData = await User.findById({ _id: userId });
        // console.log(userData);
        const addressData = await Address.findOne({ userId: userId })
        // console.log(addressData);
        const orderData = await Order.find({ userId: userId }).sort({ createdOn: -1 })
        // console.log(orderData);
        res.render("profile", { user: userData, userAddress: addressData, order: orderData })
    } catch (error) {
        console.log(error.message);
    }
}
const editUserDetails = async (req, res) => {
    try {
        const userId = req.query.id;
        const { name, phone } = req.body;

        // Input validation
        if (!name || !phone) {
            return res.status(400).redirect("/profile?error=Missing required fields");
        }

        // Update user details
        await User.findByIdAndUpdate(
            userId, 
            { 
                name, 
                phone 
            },
            { 
                runValidators: true
            }
        );

        res.redirect("/profile?success=Profile updated successfully");

    } catch (error) {
        console.error("Error updating user details:", error);
        res.status(500).redirect("/profile?error=Update failed");
    }
};

 const resetPassword = async (req, res) => {
    try {
        const userId = req.query.id;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).redirect("/profile?error=All password fields are required");
        }

        // Check if new passwords match
        if (newPassword !== confirmPassword) {
            return res.status(400).redirect("/profile?error=New passwords do not match");
        }

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).redirect("/profile?error=User not found");
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).redirect("/profile?error=Current password is incorrect");
        }

        // Password complexity check
        if (newPassword.length < 8) {
            return res.status(400).redirect("/profile?error=New password must be at least 8 characters long");
        }

        // Hash new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update user's password
        await User.findByIdAndUpdate(
            userId, 
            { 
                password: hashedPassword 
            },
            { 
                runValidators: true
            }
        );

        res.redirect("/profile?success=Password reset successfully");

    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).redirect("/profile?error=Password reset failed");
    }
};

const getAddressAddPage = async (req, res) => {
    try {
        const user = req.session.user
        res.render("add-address", { user: user })
    } catch (error) {
        console.log(error.message);
    }
}


const postAddress = async (req, res) => {
    try {
        const user = req.session.user
        console.log(user);
        const userData = await User.findOne({ _id: user })
        const {
            addressType,
            name,
            city,
            landMark,
            state,
            pincode,
            phone,
            altPhone,
        } = req.body;
        const userAddress = await Address.findOne({ userId: userData._id })
        console.log(userAddress);
        if (!userAddress) {
            console.log("fst");
            console.log(userData._id);
            const newAddress = new Address({
                userId: userData._id,
                address: [
                    {
                        addressType,
                        name,
                        city,
                        landMark,
                        state,
                        pincode,
                        phone,
                        altPhone,
                    },
                ]
            })
            await newAddress.save()
        } else {
            console.log("scnd");
            userAddress.address.push({
                addressType,
                name,
                city,
                landMark,
                state,
                pincode,
                phone,
                altPhone,
            })
            await userAddress.save()
        }

        res.redirect("/profile")

    } catch (error) {
        console.log(error.message);
    }
}

const getEditAddress = async (req, res) => {
    try {
        const addressId = req.query.id
        const user = req.session.user
        const currAddress = await Address.findOne({
            "address._id": addressId,
        });

        const addressData = currAddress.address.find((item) => {
            return item._id.toString() == addressId.toString()
        })
        // console.log(addressData);
        res.render("edit-address", { address: addressData, user: user })
    } catch (error) {
        console.log(error.message);
    }
}


const postEditAddress = async (req, res) => {
    try {
      console.log(req.body);
      const data = req.body;
      const addressId = (req.body.addressId);
      console.log(addressId, "address id");
      const user = req.session.user;
  
      // Add null check
      const findAddress = await Address.findOne({ "address._id": addressId });
      if (!findAddress) {
        console.log("Address not found");
        res.status(404).send({ message: "Address not found" });
        return;
      }
  
      const matchedAddress = findAddress.address.find(item => item._id == addressId);
      console.log(matchedAddress);
  
      // Check if matchedAddress is null
      if (!matchedAddress) {
        console.log("Matched address not found");
        res.status(404).send({ message: "Matched address not found" });
        return;
      }
  
      await Address.updateOne(
        { "address._id": addressId, "_id": findAddress._id },
        {
          $set: {
            "address.$": {
              _id: addressId,
              addressType: data.addressType,
              name: data.name,
              city: data.city,
              landMark: data.landMark,
              state: data.state,
              pincode: data.pincode,
              phone: data.phone,
              altPhone: data.altPhone
            }
          }
        }
      ).then((result) => {
        res.redirect("/profile");
      });
    } catch (error) {
      console.log(error.message);
    }
  };
  
  
const getDeleteAddress = async (req, res) => {
    try {

        const addressId = req.query.id
        const findAddress = await Address.findOne({ "address._id": addressId })
        await Address.updateOne(
            { "address._id": addressId },
            {
                $pull: {
                    address: {
                        _id: addressId
                    }
                }
            }
        )
            .then((data) => res.redirect("/profile")
            )
    } catch (error) {
        console.log(error.message);
    }
}


const getForgotPassPage = async (req, res) => {
    try {
        res.render("forgot-password")
    } catch (error) {
        console.log(error.message);
    }
}


function generateOtp() {
    const digits = "1234567890"
    var otp = ""
    for (i = 0; i < 6; i++) {
        otp += digits[Math.floor(Math.random() * 10)]
    }
    return otp
}

const forgotEmailValid = async (req, res) => {
    try {
        const { email } = req.body

        const findUser = await User.findOne({ email: email })

        if (findUser) {
            const otp = generateOtp()
            const transporter = nodemailer.createTransport({
                service: "gmail",
                port: 587,
                secure: false,
                requireTLS: true,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD
                }
            })
            const info = await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: "Verify Your Account ✔",
                text: `Your OTP is ${otp}`,
                html: `<b>  <h4 >Your OTP  ${otp}</h4>    <br>  <a href="">Click here</a></b>`,
            })
            if (info) {
                req.session.userOtp = otp
                req.session.userData = req.body
                req.session.email = email
                res.render("forgotPass-otp")
                console.log("Email sented", info.messageId);
            } else {
                res.json("email-error")
            }
        } else {
            res.render("forgot-password", { message: "User with this email already exists" })
        }
    } catch (error) {
        console.log(error.message);
    }
}


const getResetPassPage = async (req, res) => {
    try {
        res.render("reset-password")
    } catch (error) {
        console.log(error.message);
    }
}

const verifyForgotPassOtp = async (req, res) => {
    try {
        const enteredOtp = req.body.otp
        if (enteredOtp === req.session.userOtp) {

            res.json({ status: true })
        } else {
            console.log('jijijijij');
            res.json({ status: false })
        }
    } catch (error) {
        console.log(error.message);
    }
}

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash
    } catch (error) {
        console.log(error.message);
    }
}

const postNewPassword = async (req, res) => {
    try {
        const { newPass1, newPass2 } = req.body
        const email = req.session.email
        if (newPass1 === newPass2) {
            const passwordHash = await securePassword(newPass1)
            await User.updateOne(
                { email: email },
                {
                    $set: {
                        password: passwordHash
                    }
                }
            )
                .then((data) => console.log(data))
            res.redirect("/login")
        } else {
            console.log("Password not match");
            res.render("reset-password", { message: "Password not matching" })
        }


    } catch (error) {
        console.log(error.message);
    }
}


// Backend controller
const verifyReferalCode = async (req, res) => {
    try {
        const referalCode = req.body.referalCode;
        const currentUser = await User.findOne({ _id: req.session.user });
        const codeOwner = await User.findOne({ referalCode: referalCode });

        // Validation checks
        if (currentUser.redeemed === true) {
            return res.json({
                success: false,
                message: "You have already redeemed a referral code before!"
            });
        }

        if (!codeOwner || codeOwner._id.equals(currentUser._id)) {
            return res.json({
                success: false,
                message: "Invalid referral code!"
            });
        }

        const alreadyRedeemed = codeOwner.redeemedUsers.includes(currentUser._id);
        if (alreadyRedeemed) {
            return res.json({
                success: false,
                message: "You have already used this referral code!"
            });
        }

        // Process the referral
        await Promise.all([
            // Update current user
            User.updateOne(
                { _id: req.session.user },
                {
                    $inc: { wallet: 100 },
                    $push: {
                        history: {
                            amount: 100,
                            status: "credit",
                            date: Date.now()
                        }
                    },
                    $set: { redeemed: true }
                }
            ),
            // Update code owner
            User.updateOne(
                { _id: codeOwner._id },
                {
                    $inc: { wallet: 100 },
                    $push: {
                        history: {
                            amount: 100,
                            status: "credit",
                            date: Date.now()
                        },
                        redeemedUsers: currentUser._id
                    },
                    $set: { referalCode: "" }
                }
            )
        ]);

        // Get updated user data
        const updatedUser = await User.findOne({ _id: req.session.user });

        return res.json({
            success: true,
            message: "Referral code verified successfully! Both users received 100 rupees.",
            updatedWallet: updatedUser.wallet
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while processing the referral code."
        });
    }
}
module.exports = {
    getUserProfile,
    getAddressAddPage,
    postAddress,
    getEditAddress,
    postEditAddress,
    getDeleteAddress,
    editUserDetails,
    getForgotPassPage,
    forgotEmailValid,
    verifyForgotPassOtp,
    getResetPassPage,
    postNewPassword,
    verifyReferalCode,
    resetPassword
}