import { styled } from '@mui/material/styles';
import { Button } from '@material-ui/core';

const CustomButton = styled(Button)(({ theme }) => ({
    backgroundColor: 'white',
    color: 'cornflowerblue',
    borderRadius: '25px',
    padding: '10px 20px',
    '&:hover': {
      backgroundColor: 'lightgray',
    },
  }));

export default CustomButton;