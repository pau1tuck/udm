import React from "react";
import { Box } from "@chakra-ui/react";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoMdClose } from "react-icons/io";

export const NavbarMenuButton = ({ toggleMenu, isOpen }) => {
    return (
        <Box
            display={{ base: "block", sm: "none" }}
            p="2"
            pr="3"
            onClick={toggleMenu}
            opacity="0.8"
            fontSize="1.8rem"
        >
            {isOpen ? <IoMdClose /> : <GiHamburgerMenu />}
        </Box>
    );
};