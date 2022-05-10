import { Box, Text, Button, Divider, Flex, Heading, HStack, Select, SimpleGrid, VStack, Avatar, Checkbox, Icon, Table, Tbody, Td, Th, Thead, Tooltip, Tr } from "@chakra-ui/react";
import { SubmitHandler, useForm } from 'react-hook-form'
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup'
import Link from "next/link";
import { useRouter } from "next/router";
import { useMutation, useQuery } from 'react-query'

import { Input } from "../../components/Form/Input";
import { Header } from "../../components/Header";
import { Sidebar } from "../../components/Sidebar";
import { api } from "../../services/api";
import { queryClient } from "../../services/queryClient";
import { format } from "date-fns";
import useSWR from "swr";
import { useState } from "react";
import { RiAddLine, RiCheckFill, RiCloseFill, RiDeleteBin2Line, RiFileAddLine } from "react-icons/ri";


type CreateSolicitationFormData = {
  title: string,
  player: {
    id: string,
    name: string,
    email: string,
    image_url: string
  },
  score: number,
  month: string,
  description: string;
  status: string
};

type ShopCartProps = {
  id: string,
  task_id: string,
  title: string,
  score: number,
  month: string,
  created_at: string
}

type TaskProps = {
  id: string,
  title: string,
  score: number,
  created_at: string
}

const createUserFormSchema = yup.object().shape({
  title: yup.string().required('Escolha uma entrega'),
  month: yup.string().required('Selecione o mês de referência'),
})

function guidGenerator() {
  var S4 = function() {
     return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
  };
  return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

export default function CreateReward() {
  const router = useRouter()

  const [total, setTotal] = useState<number>(0)
  const [shopCart, setShopCart] = useState<ShopCartProps[]>([])
  const [taskSelected, setTaskSelected] = useState('')
  const [monthSelected, setMonthSelected] = useState('')

  const fetcher = (url) => fetch(url).then((r) => r.json());
  const { data: player, mutate: mutateUser } = useSWR('/api/user', fetcher);
  
  const { data, isLoading, error} = useQuery('tasks', async () => {
    const response = await api.get('/tasks/getAll')
    
    const tasks = response.data?.map(task => {
      return {
        id: task['ref']['@ref'].id,
        title: task.data.title,
        score: task.data.score,
        description: task.data.description,
        frequency: task.data.frequency,
        created_at: task.data.created_at,
      };
    })
    return tasks.sort((a,b) => (a.title > b.title) ? 1 : -1);
  })



  const createSolicitation = useMutation(async (solicitation: CreateSolicitationFormData) => {
    const response = await api.post('solicitations/createSolicitation', {
      solicitation: {
        ...solicitation,
        player, 
        created_at: format(new Date(), 'dd/MM/yyyy'),
      }
    })

    return response.data.badge;
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries('solicitation')
    }
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(createUserFormSchema)
  })

  function handleDeleteShopCartItem(id:string, score:number){
    const dados = shopCart
    const subtotal = total - score
    setTotal(subtotal)
    var filteredData = dados.filter(e => e.id !== id)
    setShopCart(filteredData)
  } 

  async function handleAdditem(){
    let task = data.filter(x => x.id !== taskSelected)
    const id = guidGenerator()
    const subtotal = total + task[0]?.score
    setTotal(subtotal)
    task[0].month = monthSelected
    task[0].task_id = task[0]?.id
    task[0].id = guidGenerator()
    task[0].created_at = format(new Date(), 'dd/MM/yyyy')
    setShopCart([...shopCart, task[0]])
    console.log(shopCart)
  }

  const handleCreateSolicitation: SubmitHandler<CreateSolicitationFormData> = async (values) => {
    await createSolicitation.mutateAsync(values);

    router.push(`\solicitations`)
  }
  const handleAddSolicitationItem: SubmitHandler<ShopCartProps> = async (values) => {

  }

  return (
    <Box>
      <Header />

      <Flex w="100%" my="6" maxWidth={1480} mx="auto" px="6">
        <Sidebar />

        <Box
          as="form"
          flex="1"
          borderRadius={8}
          bg="gray.800"
          p={["6", "8"]}
        >
          <Flex mb="8" justify="space-between" align="center">
            <Heading size="lg" fontWeight="normal">
              Criar Solicitação
              
              {/* { !data && <Spinner size="sm" color="gray.500" ml="4" /> } */}
            </Heading>
            <Heading size="md" fontWeight="normal">
              Total: {total}
            </Heading>

          </Flex>

          <Divider my="6" borderColor="gray.700" />

          <VStack spacing="8" onSubmit={handleSubmit(handleAddSolicitationItem)}>
            <SimpleGrid minChildWidth="240px" flex={'1'} spacing={["6", "8"]} w="100%"
            
            >
              <Box>
                <Text fontWeight='medium'>Mês de Referência</Text>
                <Select
                 mt='3'
                  name="month"
                  onChange={e=>setMonthSelected(e.target.value)}
                  label="Mês de Referência"
                  error={errors.month}
                >
                  <option key={'Selecione'} value={0}>Selecione o mês</option> 
                  <option key={'Maio'} value={'Maio'}>Maio</option>  
                  <option key={'Junho'} value={'Junho'}>Junho</option>  
                  <option key={'Julho'} value={'Julho'}>Julho</option>  
                  <option key={'Agosto'} value={'Agosto'}>Agosto</option>  
                  <option key={'Setembro'} value={'Setembro'}>Setembro</option>  
                  <option key={'Outubro'} value={'Outubro'}>Outubro</option>  
                  <option key={'Novembro'} value={'Novembro'}>Novembro</option>  
                </Select>
              </Box>
              
            </SimpleGrid>
            <SimpleGrid minChildWidth="96px" flex={'1'} spacing={["6", "8"]} w="100%"
            
            >
            
              <Box>
                <Text fontWeight='medium'>Entrega</Text>
                <SimpleGrid spacing={'2'} columns={[1,2,3]} >
                  {data?.map(item => (
                      <Button key={item.id} w='auto' p='4' colorScheme={taskSelected === item.title ? 'green' : 'gray'} onClick={() => setTaskSelected(item.title)}>{item.title}</Button>  
                    ))}
                </SimpleGrid>
              </Box>
            </SimpleGrid>
            <SimpleGrid minChildWidth="240px" flex={'1'} spacing={["6", "8"]} w="100%"
            
            >
            
              
              <Box mx='0' my={"auto"} pt={10} justifyContent='flex-end'>
                <Tooltip hasArrow label='Adicionar item' placement='top'>
                  <Button
                    type="submit"
                    as="a"
                    size="sm"
                    fontSize="sm"
                    colorScheme="teal"
                    shadow="md"
                    onClick={async ()=>await handleAdditem()}
                  >
                    <Icon as={RiAddLine} fontSize="16"/>
                  </Button>
                </Tooltip>
              </Box>
            </SimpleGrid>
          <Divider my="6" borderColor="gray.700" />
          <Table colorScheme="whiteAlpha">
                <Thead>
                  <Tr>
                    <Th px={["4", "4", "6"]} color="gray.300" width="8">
                      <Checkbox colorScheme="pink" />
                    </Th>
                    <Th>Titulo</Th>
                    <Th>Pontuação</Th>
                    <Th>Mês</Th>
                    <Th>Ação</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {shopCart?.map(solicitation => {
                    return (
                      <Tr key={solicitation.id}>
                        <Td px={["4", "4", "6"]}>
                          <Checkbox colorScheme="pink" />
                        </Td>
                        <Td>{solicitation?.title}</Td>
                        <Td>{solicitation?.score}</Td>
                        <Td>{solicitation?.month}</Td>
                        <Td>
                          <HStack>
                              <Tooltip hasArrow label='Excluir Entrega' placement='top'>
                                <Button
                                  as="a"
                                  size="sm"
                                  fontSize="sm"
                                  colorScheme="red"
                                  shadow="md"
                                  onClick={()=>handleDeleteShopCartItem(solicitation.id, solicitation.score)}
                                >
                                  <Icon as={RiDeleteBin2Line} fontSize="16"/>
                                </Button>
                              </Tooltip>
                          </HStack>
                        </Td>

                      </Tr>
                    )
                  })}
                </Tbody>
              </Table>
            
          </VStack>
          <Divider my="6" borderColor="gray.700" />
          <Flex mt="8" justify="flex-end">
            <HStack spacing="4">
              <Link href="/users" passHref>
                <Button as="a" colorScheme="whiteAlpha">Cancelar</Button>
              </Link>
              <Button
                type="submit"
                colorScheme="pink"
                isLoading={isSubmitting}
              >
                Salvar
              </Button>
            </HStack>
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
}