import React, { useContext, useEffect, useState } from 'react';
import _ from 'lodash';
import { Form, Formik } from 'formik';
import * as Yup from 'yup';
import { FormTextField, SubmitButton, SelectField } from '../Form';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import { withTranslation } from 'next-i18next';
import { StoreContext } from '../../store';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, IconButton, MenuItem, Paper, Select, TableHead, TextField, Typography } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import { RestrictButton, RestrictIconButton } from '../RestrictedComponents';
import PersonIcon from '@material-ui/icons/Person';
import SupervisorAccountIcon from '@material-ui/icons/SupervisorAccount';
import WarningIcon from '@material-ui/icons/Warning';
import ConfirmDialog from '../ConfirmDialog';
import { useObserver } from 'mobx-react-lite';

const roles = [
  'administrator',
  'renter'
];

const allowedRoles = [roles[0]];

const FormDialog = withTranslation()(({ t, members = [], onSubmit }) => {
  const store = useContext(StoreContext);

  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const _onSubmit = async (member) => {
    await onSubmit(member);
    handleClose();
  }

  const initialValues = {
    email: '',
    role: roles[1]
  }

  const validationSchema = Yup.object().shape({
    email: Yup.string().email().notOneOf(members.map(({ email }) => email)).required(),
    role: Yup.string().required()
  });

  return (
    <>
      <RestrictButton
        variant="contained"
        color="primary"
        onClick={handleClickOpen}
        onlyRoles={allowedRoles}
      >
        {t('Add member')}
      </RestrictButton>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
      >
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={_onSubmit}
        >
          {({ values, isSubmitting }) => {
            return (
              <Form autoComplete="off">
                <DialogTitle id="form-dialog-title">{t('Add member')}</DialogTitle>
                <DialogContent>
                  <DialogContentText>
                    {t('Add a new member to your organization')}
                  </DialogContentText>
                  <Box minHeight={100} minWidth={500}>
                    <Grid container spacing={1}>
                      <Grid item xs={7}>
                        <FormTextField
                          label={t('Email')}
                          name="email"
                        />
                      </Grid>
                      <Grid item xs={5}>
                        <SelectField
                          label={t('Role')}
                          name="role"
                          values={roles.map(role => (
                            { id: role, label: t(role), value: role }
                          ))}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleClose}>
                    {t('Cancel')}
                  </Button>
                  <SubmitButton
                    label={!isSubmitting ? t('Add') : t('Submitting')}
                    onlyRoles={allowedRoles}
                  />
                </DialogActions>
              </Form>
            );
          }}
        </Formik>
      </Dialog>
    </>
  );
});

const OrganizationMembers = withTranslation()(({ t, onSubmit }) => {
  const store = useContext(StoreContext);
  const [memberToRemove, setMemberToRemove] = useState(false);
  const [updating, setUpdating] = useState();

  const onAddMember = async member => {
    const updatedMembers = [
      ...store.organization.selected.members,
      member
    ];
    await onSubmit({
      members: updatedMembers
    });
  }

  const removeMember = async member => {
    setUpdating(member);
    const updatedMembers = store.organization.selected.members.filter(({ email }) => email !== member.email);
    await onSubmit({
      members: updatedMembers
    });
    setUpdating();
  }

  const onRoleChange = async (role, member) => {
    setUpdating(member);
    const updatedMembers = store.organization.selected.members.filter(({ email }) => email !== member.email);
    updatedMembers.push({
      ...member,
      role: role
    });
    await onSubmit({
      members: updatedMembers
    });
    setUpdating();
  }

  return useObserver(() => (
    <>
      <Box py={2}>
        <FormDialog members={store.organization.selected?.members} onSubmit={onAddMember} />
      </Box>
      <Paper variant="outlined" square>
        <Table aria-label="member table">
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell><Typography>{t('Member')}</Typography></TableCell>
              <TableCell><Typography>{t('Email')}</Typography></TableCell>
              <TableCell align="center"><Typography>{t('Role')}</Typography></TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(store.organization.selected?.members || []).map(member => {
              const isCurrentUser = store.user.email === member.email;
              const isAdministrator = member.role === roles[0];
              const isRegistered = member.registered;
              return (
                <TableRow hover size="small" key={member.email}>
                  <TableCell align="center">
                    {updating === member ? <CircularProgress size={20} /> : isAdministrator ? <SupervisorAccountIcon /> : <PersonIcon />}
                  </TableCell>
                  <TableCell>
                    {isRegistered ? (
                      <Typography noWrap>{member.name}</Typography>
                    ) : (
                        <Box color="warning.dark" display="flex" alignItems="center">
                          <WarningIcon fontSize="small" />
                          <Box pl={1}>
                            <Typography noWrap>{t('User not registered')}</Typography>
                          </Box>
                        </Box>
                      )}
                  </TableCell>
                  <TableCell>
                    <Typography noWrap>{member.email}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    {isCurrentUser || !store.user.isAdministrator ? (
                      <Typography noWrap>{t(member.role)}</Typography>
                    ) : (
                        <Select
                          defaultValue={member.role}
                          onChange={event => onRoleChange(event.target.value, member)}
                          displayEmpty
                          disabled={!!updating}
                        >
                          {roles.map(role => <MenuItem key={role} value={role}>{t(role)}</MenuItem>)}
                        </Select>

                      )}
                  </TableCell>
                  <TableCell>
                    {!isCurrentUser && (
                      <RestrictIconButton
                        aria-label="delete"
                        onlyRoles={allowedRoles}
                        onClick={() => setMemberToRemove(member)}
                        disabled={!!updating}
                      >
                        <DeleteIcon fontSize="small" />
                      </RestrictIconButton>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        <ConfirmDialog
          open={memberToRemove}
          setOpen={setMemberToRemove}
          onConfirm={removeMember}
        >
          <Typography>{t('Are you sure to remove this member?')}</Typography>
          <Box py={2}>
            <Typography variant="h6" align="center">{memberToRemove.name}</Typography>
          </Box>
        </ConfirmDialog>
      </Paper>
    </>
  ));
});

export default OrganizationMembers;
