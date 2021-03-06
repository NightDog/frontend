import { Form, Formik } from 'formik';
import * as Yup from 'yup';
import { FormTextField, SubmitButton } from '../Form';
import { useContext } from 'react';
import { StoreContext } from '../../store';
import { withTranslation } from '../../utils/i18n';
import { Box, Typography } from '@material-ui/core';
import { useObserver } from 'mobx-react-lite';

const validationSchema = Yup.object().shape({
    vatNumber: Yup.string(),
    bankName: Yup.string().required(),
    iban: Yup.string().required(),
    contact: Yup.string().required(),
    email: Yup.string().email().required(),
    phone1: Yup.string().required(),
    phone2: Yup.string(),
    street1: Yup.string().required(),
    street2: Yup.string(),
    city: Yup.string().required(),
    zipCode: Yup.string().required(),
    state: Yup.string(),
    country: Yup.string().required()
});

const OrganizationBilling = withTranslation()(({ t, onSubmit }) => {
    const store = useContext(StoreContext);

    const initialValues = {
        vatNumber: store.organization.selected?.companyInfo?.vatNumber || '',
        bankName: store.organization.selected?.bankInfo?.name || '',
        iban: store.organization.selected?.bankInfo?.iban || '',
        contact: store.organization.selected?.contacts?.[0].name || '',
        email: store.organization.selected?.contacts?.[0].email || '',
        phone1: store.organization.selected?.contacts?.[0].phone1 || '',
        phone2: store.organization.selected?.contacts?.[0].phone2 || '',
        street1: store.organization.selected?.addresses?.[0].street1 || '',
        street2: store.organization.selected?.addresses?.[0].street2 || '',
        city: store.organization.selected?.addresses?.[0].city || '',
        zipCode: store.organization.selected?.addresses?.[0].zipCode || '',
        state: store.organization.selected?.addresses?.[0].state || '',
        country: store.organization.selected?.addresses?.[0].country || ''
    };

    const _onSubmit = async (billing, actions) => {
        await onSubmit({
            companyInfo: {
                ...store.organization.selected.companyInfo,
                vatNumber: billing.vatNumber
            },
            bankInfo: {
                name: billing.bankName,
                iban: billing.iban
            },
            contacts: [{
                name: billing.contact,
                email: billing.email,
                phone1: billing.phone1,
                phone2: billing.phone2,
            }],
            addresses: [{
                street1: billing.street1,
                street2: billing.street2,
                city: billing.city,
                zipCode: billing.zipCode,
                state: billing.state,
                country: billing.country
            }]
        });
    }

    const allowedRoles = ['administrator'];

    return useObserver(() => (
        <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={_onSubmit}
        >
            {({ isSubmitting }) => {
                return (
                    <Form autoComplete="off">
                        {store.organization.selected && store.organization.selected.isCompany && (
                            <Box pb={2}>
                                <FormTextField
                                    label={t('VAT number')}
                                    name="vatNumber"
                                    onlyRoles={allowedRoles}
                                />
                                <FormTextField
                                    label={t('Bank name')}
                                    name="bankName"
                                    onlyRoles={allowedRoles}
                                />
                                <FormTextField
                                    label={t('IBAN')}
                                    name="iban"
                                    onlyRoles={allowedRoles}
                                />
                            </Box>
                        )}
                        <Box py={2} >
                            <Typography variant="h5">{t('Contact')}</Typography>
                            <FormTextField
                                label={t('Contact')}
                                name="contact"
                                onlyRoles={allowedRoles}
                            />
                            <FormTextField
                                label={t('Email')}
                                name="email"
                                onlyRoles={allowedRoles}
                            />
                            <FormTextField
                                label={t('Phone')}
                                name="phone1"
                                onlyRoles={allowedRoles}
                            />
                            <FormTextField
                                label={t('Phone')}
                                name="phone2"
                                onlyRoles={allowedRoles}
                            />
                        </Box>
                        <Box pt={2} pb={1}>
                            <Typography variant="h5">{t('Address')}</Typography>
                            <FormTextField
                                label={t('Street')}
                                name="street1"
                                onlyRoles={allowedRoles}
                            />
                            <FormTextField
                                label={t('Street')}
                                name="street2"
                                onlyRoles={allowedRoles}
                            />
                            <FormTextField
                                label={t('Zip code')}
                                name="zipCode"
                                onlyRoles={allowedRoles}
                            />
                            <FormTextField
                                label={t('City')}
                                name="city"
                                onlyRoles={allowedRoles}
                            />
                            <FormTextField
                                label={t('State')}
                                name="state"
                                onlyRoles={allowedRoles}
                            />
                            <FormTextField
                                label={t('Country')}
                                name="country"
                                onlyRoles={allowedRoles}
                            />
                        </Box>
                        <Box paddingTop={4}>
                            <SubmitButton
                                size="large"
                                label={!isSubmitting ? t('Setup billing information') : t('Submitting')}
                                onlyRoles={allowedRoles}
                            />
                        </Box>
                    </Form>
                )
            }}
        </Formik>
    ));
});

export default OrganizationBilling;